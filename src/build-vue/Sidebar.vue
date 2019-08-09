<template>
  <ul class="sidebar-panel mt-3">
    <nav-link v-for="(item, i) in sidebarLinks" v-bind:key="i"
        v-bind:linkdata="item"></nav-link>
    <v-expansion-panel>
      <v-expansion-panel-content>
        <template slot="header">
          <div>Browse</div>
        </template>
        <ul class="sidebar-panel py-0 pl-3">
          <nav-link v-for="(item, n) in browseTopics" v-bind:linkdata="item" v-bind:key="n"
              v-bind:handler="item.action">
          </nav-link>
        </ul>
      </v-expansion-panel-content>
    </v-expansion-panel>
    <v-expansion-panel v-if="validUser">
      <v-expansion-panel-content>
        <template slot="header">
          <div>Chat</div>
        </template>
        <v-list two-line class="sidebar-panel py-0 pl-3" v-if="sessionLoader.session != null">
          <v-dialog v-model="dialog" content-class="xl-max6">
            <div slot="activator" v-on:click="() => 0" class="chat-tile hoverable">
              <v-layout d-flex align-center class="grey--text text--darken-1">
                <v-icon v-if="fontsReady" class="grey--text text--darken-1 flex-01 mr-2" style="margin-left: -6px">add</v-icon>
                New
              </v-layout>
            </div>
            <v-card>
              <v-card-title class="title font-weight-regular pb-0">
                New conversation
              </v-card-title>
              <v-card-text id="dialog-searchbar-container">
                <v-autocomplete ref="dialog-searchbar" v-model="dialogSelectUsers" v-bind:items="dialogSearchResults"
                        v-bind:search-input.sync="dialogSearchTerm" hide-no-data
                        cache-items v-bind:filter="filterDialogSearchResults"
                        solo hide-details label="Select users" chips multiple deletable-chips
                        v-bind:menu-props="{'contentClass': 'navbar-search-results'}" id="dialog-searchbar">
                  <template v-slot:item="data">
                    <v-list-tile-content v-text="data.item.text"></v-list-tile-content>
                  </template>
                </v-autocomplete>
              </v-card-text>
              <v-card-actions class="justify-end">
                <v-btn flat color="primary" v-on:click="conversationCreate">Create</v-btn>
                <v-btn flat color="primary" v-on:click="endConversationCreate">Cancel</v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
          <v-divider></v-divider>
          <chat-tile ref="chat-tiles" v-for="item in conversationsSorted"
              v-bind:title="usersToTitle(item.users)"
              v-bind:subtitle="conversationSubtitle(item)"
              v-bind:to="'/chat/' + item.id"
              v-bind:key="item.id">
          </chat-tile>
        </v-list>
      </v-expansion-panel-content>
    </v-expansion-panel>
  </ul>
</template>

<script>
function loadBookmarks(vm) {
  vm.browseTopics.splice(1);  // keep "View all"
  axios.post('/backend-ls.php', { page: 'bookmarks' })
    .then((response) => {
      if(typeof response.data === 'object') {
        if(Array.isArray(response.data.bookmarks)) {
          response.data.bookmarks.forEach(topic => {
            vm.browseTopics.push({
              href: `/topic/${topic.topic_id}`,
              text: topic.name
            });
          });
        }
      }
    });
}

function stringSequenceEquals(arr1, arr2) {
  if(arr1.length !== arr2.length) {
    return false;
  }
  const hash = {};
  for(let i = 0; i < arr1.length; i++) {
    if(hash[arr1[i]] === undefined) {
      hash[arr1[i]] = 0;
    }
    if(hash[arr2[i]] === undefined) {
      hash[arr2[i]] = 0;
    }
    hash[arr1[i]] += 1;
    hash[arr2[i]] -= 1;
  }
  return (Object.values(hash).filter(e => e !== 0).length === 0);
}

Vue.component('v--sidebar', {
  template: template``,
  name: 'v--sidebar',
  props: {
    validUser: Boolean,
    fontsReady: Boolean,
    userName: String,
    sessionLoader: ChatSessionLoader
  },
  data: function() {
    return {
      browseTopics: [
        { href: '/browse', text: 'View all' }
      ],

      dialogSearchResults: [],
      dialogSearchTerm: '',
      dialog: false,
      dialogSelectUsers: [],
      dialogInputState: 0
    }
  },
  computed: {
    sidebarLinks: function() {
      let _sl = [];
      // if(!this.validUser) {
        
      // } else {
        
      // }
      if(this.$route.name !== 'dashboard') {
        _sl.push({ href: '/dashboard', text: 'Dashboard' });
      }
      return _sl;
    },
    conversationsSorted: function() {
      if(this.sessionLoader.session == null) {
        return [];
      }
      const sorted = this.sessionLoader.session.conversations.slice();
      sorted.sort((a, b) => {
        const mostRecentA = this.conversationMostRecent(a);
        const mostRecentB = this.conversationMostRecent(b);
        const timeA = (mostRecentA ? mostRecentA.time : NaN);
        const timeB = (mostRecentB ? mostRecentB.time : NaN);
        if(Number.isNaN(timeA) || Number.isNaN(timeB)) {
          return 0;
        }
        return (timeA > timeB ? -1 : 1);
      });
      return sorted;
    }
  },
  watch: {
    dialogSearchTerm: function(v) {
      if(this.dialogInputState === 2 && v === '') {
        this.dialogInputState = 0;
      } else {
        this.dialogInputState = 1;
      }
      if(v === '') {
        if(this.$refs != null && (this.$refs['dialog-searchbar']) != null) {
          this.$refs['dialog-searchbar'].onInternalSearchChanged('');
        }
        this.dialogSearchResults.splice(0);
        return;
      }
      debounce.invoke(this.getDialogSearchResults, [v, this.dialogSearchResults], 100);
    },
    dialogSelectUsers: function(v) {
      this.dialogInputState = 2;
      this.dialogSearchTerm = '';
    }
  },
  methods: {
    getDialogSearchResults: function(q, resultsRef, searchComponent) {
      axios.post('/backend-search.php', { search: true, q: q, restrict: 'user keystore' })
        .then(function(response) {
          const allItems = [];
          if(Array.isArray(response.data.data)) {
            response.data.data.forEach(row => {
              const searchResult = Object.assign({}, row, {
                text: row.result,
                value: row.result.substring(1),
                hadQuery: q
              });
              allItems.push(searchResult);
            });
          }
          allItems.sort(function(a, b) {
            return (a.relevance > b.relevance ? -1 : 1);
          });
          const l = Math.min(5, allItems.length);
          for(let i = 0; i < l; i++) {
            resultsRef.splice(i, 1, allItems[i]);
          }
          resultsRef.splice(l);
        });
    },
    filterDialogSearchResults: function(item, q, itemText) {
      if(q.length === 0) {
        return false;
      }
      return item.hadQuery === q;
    },
    usersToTitle: function(arr) {
      return arr.filter(e => e !== this.userName).map(e => '@'+e).join(', ');
    },
    conversationMostRecent: function(conv) {
      let sortedMessages = conv.messages.slice();
      sortedMessages = sortedMessages.sort((a, b) => -a.time + b.time);
      return sortedMessages[0];
    },
    conversationSubtitle: function(conv) {
      // sort descending
      const mostRecent = this.conversationMostRecent(conv);
      if(mostRecent == null) {
        return '\u2014';
      }
      return (mostRecent.from === this.userName ? 'Sent' : 'Received') + ' at ' +
          getRelativeTimeString(mostRecent.time / 1000);
    },
    conversationCreate: function() {
      if(this.sessionLoader.session == null) {
        return;
      }
      if(Array.isArray(this.dialogSelectUsers)) {
        this.sessionLoader.session.enqueue('conversation_request ' + this.dialogSelectUsers.join(';'), 0);
        this.dialogSearchDisabled = true;
      }
    },
    endConversationCreate: function(id) {
      if(this.sessionLoader.session == null) {
        return;
      }
      this.dialog = false;
      this.dialogSelectUsers = [];
      this.dialogSearchDisabled = false;
      if(id > 0) {
        this.$router.push(`/chat/${id}`)
      }
    },
    conversation_ls: function(conversation) {
      if(this.dialog && Array.isArray(this.dialogSelectUsers)) {
        const expectedUsers = [this.userName].concat(this.dialogSelectUsers);
        if(stringSequenceEquals(expectedUsers, conversation.users)) {
          this.endConversationCreate(conversation.id);
        }
      }
    }
  },
  created: function() {
    loadBookmarks(this);
    this.sessionLoader.ready.then(session => {
      session.externalMessageHandlers.conversation_ls = this.conversation_ls.bind(this);
    }, errorMsg => 0);

    this.$router.afterEach((to, from) => {
      loadBookmarks(this);
    });
  }
})
</script>