<template>
  <v-container>
    <v-card class="elevation-5">
      <v-card-title primary-title>
        <v-layout d-flex align-center>
            <h1 class="mb-2 mr-2 font-weight-regular" style="font-size: 28px; overflow: hidden; text-overflow: ellipsis;"
                v-text="'@' + pageUsername"></h1>
            <v-spacer></v-spacer>
            <v-btn v-if="validUser && !empty(userFollow) && !userFollow.own_profile"
                    class="mb-3 btn-dense flex-01 border-radius-r0"
                    v-bind:color="userButton.color" v-bind:disabled="userButton.disabled"
                    v-bind:class="[userButton.disabled ? 'theme--light' : 'theme--dark']"
                    v-on:click="userButton.action">
              {{ userButton.text }}
              <v-icon v-if="fontsReady" class="pl-2" v-text="userButton.icon"></v-icon>
            </v-btn>
            <v-menu v-if="validUser && !empty(userFollow) && !userFollow.own_profile" transition="fade-transition"
                    bottom left nudge-bottom="36px" class="flex-01">
              <v-btn class="mb-3 btn-dense border-radius-l0" v-bind:color="!userButton.disabled ? userButton.color : 'rgba(0,0,0,.52)'"
                      outline slot="activator" style="border-left: none; max-width: 18px !important;">
                <v-icon v-if="fontsReady">arrow_drop_down</v-icon>
              </v-btn>
              <ul class="navbar-dropdown">
                <nav-link right ref="navbar-links" v-for="(item, n) in userLinks"
                      v-bind:linkdata="item" v-bind:key="n" v-bind:handler="item.action">
                </nav-link>
              </ul>
          </v-menu>
        </v-layout>
      </v-card-title>

      <v-card-title class="mt-0 pt-0">
        <v-layout v-if="$vuetify.breakpoint.xsOnly" d-flex align-center justify-start class="px-1">
          <v-btn flat class="px-2 ma-0 btn-two-line" style="color: rgba(0,0,0,.7);">
            Followers<br>{{ empty(userFollow) ? "" : userFollow.follower_count }}
          </v-btn>
          <v-divider vertical style="background-color: #b0bec5;"></v-divider>
          <v-btn flat class="px-2 ma-0 btn-two-line" style="color: rgba(0,0,0,.7);">
            Following<br>{{ empty(userFollow) ? "" : userFollow.following_count }}
          </v-btn>
        </v-layout>
        <v-layout v-else class="px-1">
          <a class="subheading mr-4 text-decoration-none" style="color: rgba(0,0,0,.7);">
            <span class="font-weight-bold">{{ empty(userFollow) ? "" : userFollow.follower_count }}</span>
            {{ userFollow.follower_count === 1 ? 'follower' : 'followers' }}
          </a>
          <a class="subheading mr-4 text-decoration-none" style="color: rgba(0,0,0,.7);">
            <span class="font-weight-bold">{{ empty(userFollow) ? "" : userFollow.following_count }}</span>
            following
          </a>
        </v-layout>
      </v-card-title>
    </v-card>

    <v-card class="mt-4 pb-4 elevation-5" v-if="userSheetsDisplay">
      <v-card-title class="mb-0" primary-title>
        <h1 class="px-1 font-weight-regular" style="font-size: 28px;">Sheets</h1>
      </v-card-title>
      <v-card-text class="py-0">
        <v-data-table :hide-actions="true" id="user-sheets" class="datatable"
                v-bind:headers="userSheetsHeaders" v-bind:items="userSheets">
          <template v-slot:items="props">
            <tr v-on:click="$router.push(props.item.href)">
              <td v-for="column in userSheetsHeaders" v-text="props.item[column.value]"
                  v-bind:key="column.value"
                  v-bind:class="{ 'text-xs-right': (column.align === 'right') }"></td>
            </tr>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script>
var __userProfile = Vue.component('user-profile', {
  template: template``,
  name: 'user-profile',
  props: {
    validUser: Boolean,
    fontsReady: Boolean,
    userName: String,
    pageUsername: String
  },
  data: function() {
    return {
      userFollow: {},
      userSheetsDisplay: false,
      userSheetsHeaders: [
        {
          text: 'Topic',
          value: 'topic',
          align: 'left',
          sortable: false,
          class: '',
          width: 'auto'
        },
        {
          text: 'Date modified',
          value: 'date',
          align: 'right',
          sortable: false,
          class: '',
          width: 'auto'
        }
      ],
      userSheets: []
    }
  },
  computed: {
    userLinks: function() {
      if(this.userFollow != null) {
        if(this.userFollow.you_block) {
          return [
            { href: '', text: 'Unblock', action: () => this.pageUserFollow('unblock') }
          ];
        } else {
          return [
            { href: '', text: 'Block', action: () => this.pageUserFollow('block') }
          ]
        }
      }
      return [];
    },
    userButton: function() {
      var btnObj = {
        text: 'Follow',
        color: '#1976D2',
        icon: 'person_add',
        disabled: true,
        action: '',
        tooltip: null
      }
      if(!empty(this.userFollow, 'object')) {
        if(this.userFollow.blocks_you) {
          btnObj.tooltip = 'This user has blocked you';
        } else if(this.userFollow.you_block) {
          btnObj.tooltip = 'You have blocked this user';
        } else if(this.userFollow.you_follow) {
          btnObj.text = 'Following';
          btnObj.color = '#4CAF50';
          btnObj.icon = 'check';
          btnObj.disabled = false;
          btnObj.action = () => this.pageUserFollow("unfollow");
        } else {
          btnObj.disabled = false;
          btnObj.action = () => this.pageUserFollow("follow");
        }
      }

      return btnObj;
    }
  },
  watch: {
    pageUsername: function(v) {
      this.$emit('update:title', 'User @' + v);
      loadProfile(this);
    }
  },
  methods: {
    empty: empty,
    pageUserFollow: function(verb) {
      doUserFollow(this.pageUsername, verb).then(row => {
        const followerDecr = (this.userFollow.you_follow ? -1 : 0);
        const uf = {
          blocks_you: (row.conn_type & 8) === 8,
          you_block: (row.conn_type & 4) === 4,
          follows_you: (row.conn_type & 14) === 2,
          you_follow: (row.conn_type & 13) === 1
        };
        const followerIncr = (uf.you_follow ? 1 : 0);
        
        uf.follower_count = this.userFollow.follower_count + followerDecr + followerIncr;
        this.userFollow = Object.assign({}, this.userFollow, uf);
      });
    }
  },
  created: function() {
    this.$emit('update:title', 'User @' + this.pageUsername);
    loadProfile(this);
  }
});

function loadProfile(vm) {
  axios.post('/backend-user.php', { page_user: vm.pageUsername })
    .then(function(response) {
      vm.userFollow = {};
      vm.userSheets = [];
      vm.userSheetsDisplay = false;
      if(!empty(response.data, 'object') && response.data.error === undefined) {
        const defaultData = {
          own_profile: false,
          blocks_you: false,
          you_block: false,
          you_follow: false,
          follows_you: false,
          follower_count: 0,
          following_count: 0
        };
        vm.userFollow = Object.assign(defaultData, response.data);

        if(Array.isArray(response.data.user_sheets)) {
          response.data.user_sheets.forEach(row => {
            const rowObj = {
              id: row.topic_id,
              topic: row.topic,
              date: getRelativeTimeString(row.mtime),
              href: `/topic/${row.topic_id}/${vm.pageUsername}`
            };
            vm.userSheets.push(rowObj);
          });
          vm.userSheetsDisplay = (vm.userSheets.length > 0);
        }
      } else {
        vm.$router.push('/error/3');
      }
    });
}
</script>
