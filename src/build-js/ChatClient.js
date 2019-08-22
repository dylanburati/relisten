import { base64decodebytes, base64encodebytes,
    isValidUUID, isValidBase64Triplet,
    CipherStore, wrapKey, unwrapKey, tripleKeyAgree } from './ChatUtils';

/* global window WebSocket localStorage */
const commandHandlers = {
  conversation_request(commandResults, session) {
    const conversationRequest = JSON.parse(commandResults);
    session.makeConversationRequest(conversationRequest).then(toAdd => {
      session.enqueue('conversation_add ' + JSON.stringify(toAdd), 0);
    });
  },

  conversation_ls(commandResults, session) {
    const conversationLS = JSON.parse(commandResults);
    const keysToRequest = [];
    const promises = [];
    conversationLS.forEach(conversationObj => {
      const promise = session.addConversation(conversationObj).then(conversationStatus => {
        if(conversationStatus === false) {
          if(keysToRequest.indexOf(conversationObj.role1) === -1) {
            keysToRequest.push(conversationObj.role1);
            session.pendingConversations.push(conversationObj);
          }
        } else if(conversationStatus === true) {
          if(session.catSent.indexOf(conversationObj.id) === -1) {
            session.catSent.push(conversationObj.id);
            session.pendingMessageHandler(conversationObj.id);
            session.enqueue(`conversation_cat ${conversationObj.id}`, 0);
          }
          if(session.externalMessageHandlers != null &&
                  typeof session.externalMessageHandlers.conversation_ls === 'function') {
            session.externalMessageHandlers.conversation_ls(conversationObj);
          }
        } else if(typeof conversationStatus === 'string') {
          // conversationStatus is conversationKeyWrapped
          // response to conversation_set_key will be conversation_ls
          session.enqueue(`conversation_set_key ${conversationObj.id} ${conversationStatus}`, 0);
        }
      });
      promises.push(promise);
    });
    Promise.all(promises).then(promiseResultArr => {
      if(keysToRequest.length > 0) {
        session.enqueue('retrieve_keys_other ' + keysToRequest.join(';'), 0);
      }
    });
  },

  conversation_cat(commandResults, session) {
    const pastMessages = JSON.parse(commandResults);
    if(pastMessages.length > 0) {
      const conversationID = parseInt(pastMessages[0].split(';')[0]);
      const conversation = session.conversations.find(e => (e.id === conversationID));
      if(conversation == null) {
        session.pendingMessages.push({
          handler: 'conversation_cat',
          conversationID: conversationID,
          messages: commandResults
        });
        return;
      }
      pastMessages.forEach(pastMsg => {
        const msgObj = { id: conversationID };
        const msgFields = pastMsg.split(';', 6);
        const [id, from, time, contentType, iv, hmac] = msgFields;
        if(parseInt(id) !== conversationID) {
          return;
        }
        const ciphertext = pastMsg.substring(msgFields.reduce((acc, cur) => (acc + cur.length), 0) + 6);
        msgObj.from = from;
        msgObj.time = parseInt(time);
        msgObj.contentType = contentType;
        conversation.cipher.decrypt(
          base64decodebytes(iv), base64decodebytes(hmac), base64decodebytes(ciphertext)
        ).then(msgData => {
          msgObj.data = msgData;

          conversation.messages.push(msgObj);
          if(session.externalMessageHandlers != null &&
            typeof session.externalMessageHandlers.conversation_cat === 'function') {
            session.externalMessageHandlers.conversation_cat(conversation, msgObj);
          }
        });
      });
    }
  },

  retrieve_keys_self(commandResults, session) {
    const keyset = JSON.parse(commandResults);
    session.keysets.push(keyset);
  },

  retrieve_keys_other(commandResults, session) {
    const otherKeysets = JSON.parse(commandResults);
    otherKeysets.forEach(keyset => {
      session.keysets.push(keyset);
      const conversationObj = session.pendingConversations.find(e => (keyset.user === e.role1));
      if(conversationObj != null) {
        session.addConversation(conversationObj).then(conversationStatus => {
          if(conversationStatus === false) {
            throw new Error('retrieve_keys_self must be called before retrieve_keys_other');
          } else if(conversationStatus === true) {
            if(session.catSent.indexOf(conversationObj.id) === -1) {
              session.catSent.push(conversationObj.id);
              session.pendingConversations = session.pendingConversations.filter(e => (keyset.user !== e.role1));
              session.enqueue(`conversation_cat ${conversationObj.id}`, 0);
            }
          } else if(typeof conversationStatus === 'string') {
            // conversationStatus is conversationKeyWrapped
            // response to conversation_set_key will be conversation_ls
            session.pendingConversations = session.pendingConversations.filter(e => (keyset.user !== e.role1));
            session.enqueue(`conversation_set_key ${conversationObj.id} ${conversationStatus}`, 0);
          }
        });
      }
    });
  },

  set_preferences(commandResults, session) {
    const preferences = JSON.parse(commandResults);
    Object.assign(session.preferences, preferences);
    if(session.externalMessageHandlers != null &&
            typeof session.externalMessageHandlers.set_preferences === 'function') {
      session.externalMessageHandlers.set_preferences(preferences);
    }
  },

  user_message(currentMsg, session) {
    // user
    // conversationID;from;time;classes;iv;hmac;messageData
    const msgObj = {};
    const msgFields = currentMsg.split(';', 6);
    const conversationID = parseInt(msgFields[0]);
    const [from, time, contentType, iv, hmac] = msgFields.slice(1);
    if(conversationID <= 0) {
      return;
    }
    const conversation = session.conversations.find(e => (e.id === conversationID));
    if(conversation == null) {
      if(session.catSent.indexOf(conversationID) !== -1) {
        session.pendingMessages.push({
          handler: 'user_message',
          conversationID: conversationID,
          messages: currentMsg
        });
      }
      return;
    }
    const ciphertext = currentMsg.substring(msgFields.reduce((acc, cur) => (acc + cur.length), 0) + 6);
    msgObj.id = conversationID;
    msgObj.from = from;
    msgObj.time = parseInt(time);
    msgObj.contentType = contentType;
    conversation.cipher.decrypt(
      base64decodebytes(iv), base64decodebytes(hmac), base64decodebytes(ciphertext)
    ).then(msgData => {
      msgObj.data = msgData;

      conversation.messages.push(msgObj);
      if(session.externalMessageHandlers != null &&
          typeof session.externalMessageHandlers.user_message === 'function') {
        session.externalMessageHandlers.user_message(conversation, msgObj);
      }
    });
  }
};

export class ChatSessionLoader {
  constructor(uuidResolver) {
    this.session = null;
    this.error = false;
    this.ready = uuidResolver
      .then(uuid => {
        this.session = new ChatSession(uuid, {})
        this.session.keyWrapper = new CipherStore(base64decodebytes(localStorage.getItem('keyWrapper')), false);
        return this.session.keyWrapper.readyPromise;
      }).then(() => {
        return this.session.enqueue('retrieve_keys_self', 0);
      }).then(() => {
        this.session.enqueue('conversation_ls', 0);
        return this.session;
      }, (error) => {
        this.error = error;
        throw error;
      });
  }
}

class ChatSession {
  constructor(uuid, externalMessageHandlers) {
    if(!isValidUUID(uuid)) {
      throw new Error('Not connected');
    }
    this.uuid = uuid;

    this.conversations = [];
    this.keysets = [];
    this.messages = [];
    this.preferences = {};
    this.pendingConversations = [];
    this.pendingMessages = [];
    this.catSent = [];
    this.keyWrapper = null;

    this.externalMessageHandlers = externalMessageHandlers;

    this.websocket = new WebSocket(`wss://${window.location.hostname}:8082/${this.uuid}`);
    this.websocket.onmessage = (m) => {
      this.internalMessageHandler(m.data);
    };
  }

  async enqueueWithContentType(str, contentType, conversationID) {
    if(!(this.websocket instanceof WebSocket) || this.websocket.readyState >= WebSocket.CLOSING) {
      throw new Error('Not connected');
    }
    if(this.websocket.readyState === WebSocket.CONNECTING) {
      await new Promise((resolve, reject) => {
        this.websocket.onopen = resolve;
      });
    }
    if(typeof contentType !== 'string') {
      return false;
    }
    if(str.length === 0) {
      return true;
    }

    if(conversationID === 0) {
      const msg = '0;' + str;
      this.websocket.send(msg);
      return true;
    } else if(conversationID > 0) {
      const conv = this.conversations.find(e => (e.id === conversationID));
      if(conv == null) {
        return false;
      }
      const { iv, hmac, ciphertext } = await conv.cipher.encrypt(str);
      let msg = `${conversationID};${contentType};`;
      msg += base64encodebytes(iv) + ';';
      msg += base64encodebytes(hmac) + ';';
      msg += base64encodebytes(ciphertext);
      this.websocket.send(msg);
      return true;
    } else {
      return false;
    }
  }

  async enqueue(str, conversationID) {
    const result = await this.enqueueWithContentType(str, '', conversationID);
  }

  async makeConversationRequest(conversationRequest) {
    const self = conversationRequest.find(e => ('identity_private' in e));
    if(self == null) {
      throw new Error('Request is missing required keys');
    }
    const toAdd = { users: [] };
    const userNameList = [self.user];

    const conversationKeyBytes = new Uint8Array(32);
    window.crypto.getRandomValues(conversationKeyBytes);
    const conversationCipher = new CipherStore(conversationKeyBytes);
    await conversationCipher.readyPromise;

    const asyncLoopFunction = async(other) => {
      if(other === self) return;
      userNameList.push(other.user);
      const keyAgreement = await tripleKeyAgree(self, other, true, this.keyWrapper);
      const otherUserObj = {
        user: other.user,
        role: 2,
        key_ephemeral_public: keyAgreement.key_ephemeral_public,
        initial_message: ''
      };
      const initialCipher = new CipherStore(keyAgreement.key_secret);
      await initialCipher.readyPromise;
      const { iv, hmac, ciphertext } = await initialCipher.encryptBytes(conversationKeyBytes);
      otherUserObj.initial_message += base64encodebytes(iv) + ';';
      otherUserObj.initial_message += base64encodebytes(hmac) + ';';
      otherUserObj.initial_message += base64encodebytes(ciphertext);
      toAdd.users.push(otherUserObj);
    };

    const promises = [];
    conversationRequest.forEach(other => {
      promises.push(asyncLoopFunction(other));
    });
    await Promise.all(promises);

    const selfUserObj = {
      user: self.user,
      role: 1,
      key_wrapped: ''
    };
    selfUserObj.key_wrapped = await wrapKey(conversationKeyBytes, this.keyWrapper);
    toAdd.users.push(selfUserObj);
    return toAdd;
  }

  async addConversation(conversationObj) {
    const toAdd = {
      id: conversationObj.id,
      users: conversationObj.users,
      messages: [],
      cipher: null
    };

    if(typeof conversationObj.key_wrapped === 'string') {
      // User's part of key exchange is complete
      if(this.conversations.findIndex(e => (e.id === conversationObj.id)) !== -1) {
        // Conversation has already been added
        return true;
      }
      const conversationKeyBytes = await unwrapKey(conversationObj.key_wrapped, this.keyWrapper);
      toAdd.cipher = new CipherStore(conversationKeyBytes);
      await toAdd.cipher.readyPromise;
      this.conversations.push(toAdd);
      return true;
    } else {
      // User's part of key exchange is incomplete
      const self = this.keysets.find(e => ('identity_private' in e));
      const other = this.keysets.find(e => (e.user === conversationObj.role1));
      if(self == null || other == null) {
        // Message handler should request keys from the server and retry
        return false;
      }

      const [iv, hmac, ciphertext] = conversationObj.initial_message.split(';');
      if(!isValidBase64Triplet(iv, hmac, ciphertext)) {
        throw new Error('Initial message is not properly formatted');
      }
      const otherUserObj = Object.assign({}, other, { ephemeral_public: conversationObj.key_ephemeral_public });
      const keyAgreement = await tripleKeyAgree(self, otherUserObj, false, this.keyWrapper);
      const initialCipher = new CipherStore(keyAgreement.key_secret);
      await initialCipher.readyPromise;
      const conversationKeyBytes = await initialCipher.decryptBytes(
        base64decodebytes(iv), base64decodebytes(hmac), base64decodebytes(ciphertext)
      );
      toAdd.cipher = new CipherStore(conversationKeyBytes);
      await toAdd.cipher.readyPromise;
      this.conversations.push(toAdd);

      const conversationKeyWrapped = await wrapKey(conversationKeyBytes, this.keyWrapper);
      return conversationKeyWrapped;  // Message handler should upload wrapped key to the server
    }
  }

  internalMessageHandler(message) {
    console.log(message);
    let [conversationID, messageType] = message.split(';', 2);
    conversationID = parseInt(conversationID);
    if(conversationID === 0) {
      // server
      // conversationID;messageType;messageData
      if(messageType === 'command') {
        const messageData = message.substring(conversationID.toString().length + messageType.length + 2);
        const commandIdx = messageData.indexOf(';');
        const command = messageData.substring(0, commandIdx);
        const commandResults = messageData.substring(commandIdx + 1);
        const commandHandler = commandHandlers[command];
        if(typeof commandHandler === 'function') {
          commandHandler(commandResults, this);
        }
      }
    } else {
      // user
      // conversationID;from;time;classes;iv;hmac;messageData
      commandHandlers.user_message(message, this);
    }
  }

  pendingMessageHandler(conversationID) {
    const toHandle = this.pendingMessages.filter(e => (e.conversationID === conversationID));
    toHandle.forEach(pendingObj => {
      if(pendingObj.handler === 'conversation_cat') {
        commandHandlers.conversation_cat(pendingObj.messages, this);
      } else if(pendingObj.handler === 'user_message') {
        commandHandlers.user_message(pendingObj.messages, this);
      }
    });
    this.pendingMessages = this.pendingMessages.filter(e => (e.conversationID !== conversationID));
  }
}
