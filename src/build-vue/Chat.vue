<template>
  <v-container fluid v-if="!validUser || (sessionLoader.session == null)">
    <p v-if="!validUser" class="mt-3"><a href="/login.php">Log in</a> to use the chat.</p>
    <p v-else-if="sessionLoader.error" class="mt-3">An unexpected error occured</p>
  </v-container>
  <v-container fluid id="chat-container" v-else v-bind:style="{height: '100%'}">
    <v-layout d-flex align-center id="chat-header" class="mt-2 flex-01">
      <h1 class="pa-2 font-weight-regular" id="chat-title">{{ activeChatTitle }}</h1>
      <v-menu transition="fade-transition" bottom left nudge-bottom="36px" class="flex-01">
        <v-btn class="btn-group-bg200" slot="activator" style="max-width: 100px !important;">
          Options
          <v-icon v-if="fontsReady" style="margin-right: -6px;">arrow_drop_down</v-icon>
        </v-btn>
        <ul class="navbar-dropdown">
          <li style="padding: 0.25rem 1rem; list-style: none;">
            <v-layout d-flex align-center>
              <v-checkbox hide-details v-bind:ripple="false" v-model="chatPreferences.markdown"
                      v-on:click="chatSetPreferences('markdown', !chatPreferences.markdown)"></v-checkbox>
              Markdown
            </v-layout>
          </li>
          <nav-link right ref="navbar-links" v-for="(item, n) in chatOptionLinks" v-bind:linkdata="item" v-bind:key="n">
          </nav-link>
        </ul>
      </v-menu>
      <v-btn flat icon class="ml-3 flex-01" v-on:click="$router.back()">
        <v-icon class="grey--text text--darken-1" v-if="fontsReady">close</v-icon>
      </v-btn>
    </v-layout>
    <div style="display: block;" id="message-container">
      <v-layout d-flex column justify-end id="message-panel">
        <single-message v-for="item in visibleMessages" v-bind:key="item.n"
            v-bind:msgdata="item" v-bind:group-chat="groupChatActive">
        </single-message>
      </v-layout>
    </div>
    <v-layout d-flex align-baseline id="chat-footer" class="flex-01">
      <v-textarea v-model="chatCompose" rows="1" auto-grow color="primary" v-attach-height-guard="122"
              placeholder="Send a message" class="ml-2 elevation-5 chat-stdin-container" id="chat-stdin"
              v-on:keydown.ctrl.enter="chatSend">
      </v-textarea>
      <v-btn v-on:click="chatSend" color="primary" class="mx-2 elevation-5 btn-group-bg200"
              style="height: 36px !important; max-width: 36px !important; margin: 0 8px !important; transform: translateY(8px);">
        <v-icon v-if="fontsReady">send</v-icon>
      </v-btn>
    </v-layout>
  </v-container>
</template>

<script>
Vue.directive('attach-height-guard', {
  update: function(el, binding, vnode) {
    const contentEl = el.querySelector('#chat-stdin');
    const ctrlEl = el.querySelector('.v-text-field__slot');
    if(contentEl == null || ctrlEl == null) return;
    if(contentEl.scrollHeight > binding.value) {
      ctrlEl.style.height = `${binding.value}px`;
    } else {
      ctrlEl.style.height = 'unset';
    }
  }
});

Vue.component('single-message', {
  props: {
    msgdata: {
      type: Object,
      required: true
    },
    groupChat: Boolean
  },
  template: `<div style="flex: 0 1 !important;" class="single-message-container">
    <p style="color: #6c757d;" class="mt-1 mb-0 ml-2" v-if="groupChat &&
            (msgdata.classes.indexOf('message-left') !== -1) && !msgdata.consecutive" v-text="'@' + msgdata.from"></p>
    <div v-bind:class="msgdata.classes">
      <div class="ma-0 pa-0 markdown-container" v-html="msgdata.data"></div>
    </div>
  </div>`
});

const markedOpts = { gfm: true };

var __chat = Vue.component('chat', {
  template: template``,
  name: 'chat',
  props: {
    validUser: Boolean,
    fontsReady: Boolean,
    userName: String,
    sessionLoader: ChatSessionLoader,
    activeChat: {
      type: Number,
      default: -1
    }
  },
  data: function() {
    return {
      chatCompose: '',
      chatOptionLinks: [],
      chatPreferences: {},
      visibleMessages: []
    }
  },
  computed: {
    activeConversation: function() {
      if(this.sessionLoader.session == null) {
        return null;
      }
      return this.sessionLoader.session.conversations.find(e => e.id === this.activeChat);
    },
    activeChatTitle: function() {
      const conv = this.activeConversation;
      if(conv == null) {
        return 'Chat';
      }
      return this.usersToTitle(conv.users);
    },
    groupChatActive: function() {
      const conv = this.activeConversation;
      if(conv == null) {
        return false;
      }
      return (conv.users.length > 2);
    }
  },
  watch: {
    activeChat: function(v) {
      this.getVisibleMessages(1);
    }
  },
  methods: {
    usersToTitle: function(arr) {
      return arr.filter(e => e !== this.userName).map(e => '@'+e).join(', ');
    },
    getVisibleMessages: function(scroll) {
      if(this.activeConversation == null) {
        return;
      }
      let sortedMessages = this.activeConversation.messages.slice();
      sortedMessages = sortedMessages.sort((a, b) => a.time - b.time);
      this.visibleMessages = [];
      for(let i = 0; i < sortedMessages.length; i++) {
        const consecutive = (i > 0 && (sortedMessages[i].from === sortedMessages[i - 1].from));
        const classes = [(sortedMessages[i].from === this.userName ? 'message-right' : 'message-left')];
        if(consecutive) classes.push('consecutive');
        const vMsgObj = Object.assign({}, sortedMessages[i], {
          n: this.visibleMessages.length,
          classes: classes,
          consecutive: consecutive,
          data: this.messageHtml(sortedMessages[i])
        });
        this.visibleMessages.push(vMsgObj);
        if(scroll === 1) {
          debounce.invoke(this.panelScrollFull, [], 100);
        } else if(scroll === 2) {
          debounce.invoke(this.panelScrollFull, [], 100);
        }
      }
    },
    messageHtml: function(msgObj) {
      if(/(^| )markdown( |$)/.test(msgObj.contentType)) {
        return DOMPurify.sanitize(marked(msgObj.data, markedOpts));
      }
      return DOMPurify.sanitize(`<p class="multiline-text">${msgObj.data}</p>`);
    },
    chatSend: function() {
      if(this.sessionLoader.session != null) {
        this.sessionLoader.session.enqueue(this.chatCompose, this.activeChat);
        this.chatCompose = '';
      }
    },
    chatSetPreferences: function(key, value) {
      this.$nextTick(() => {
        const json = {};
        if(typeof key === 'string') {
          json[key] = value;
        }
        if(this.sessionLoader.session != null) {
          this.sessionLoader.session.enqueue('set_preferences ' + JSON.stringify(json), 0);
        }
      });
    },
    panelScrollFull: function() {
      const panel = document.getElementById('message-container');
      if(panel != null) {
        panel.scroll(0, panel.scrollHeight - panel.clientHeight);
      }
    },

    conversation_cat: function(conversation, msgObj) {
      this.getVisibleMessages(1);
    },
    set_preferences: function(prefObj) {
      Object.assign(this.chatPreferences, prefObj);
    },
    user_message: function(conversation, msgObj) {
      this.getVisibleMessages(2);
    }
  },
  created: function() {
    this.$emit('update:title', 'Chat');
    this.sessionLoader.ready.then(session => {
      session.externalMessageHandlers.conversation_cat = this.conversation_cat.bind(this);
      session.externalMessageHandlers.set_preferences = this.set_preferences.bind(this);
      session.externalMessageHandlers.user_message = this.user_message.bind(this);
      this.chatSetPreferences();
      this.getVisibleMessages(1);
    }, errorMsg => 0);
  }
})
</script>
