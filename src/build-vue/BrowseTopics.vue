<template>
  <v-container>
    <v-layout d-flex align-center class="my-3">
      <h1 class="headline">Topics</h1>
    </v-layout>

    <v-layout d-flex wrap>
      <v-card v-for="topic in topics" v-bind:key="topic.id" ref="topics"
              class="elevation-5 mb-3" style="min-width: 320px !important; flex-basis: 50% !important;">
        <v-card-title primary-title>
          <v-layout d-flex align-center>
            <h2 class="headline" v-text="topic.name"></h2>
            <v-spacer></v-spacer>
            <v-btn flat icon class="btn-dense flex-01 my-0" v-if="validUser"
                    v-on:click="toggleBookmark(topic, i)">
              <template v-if="fontsReady">
                <v-icon class="grey--text text--darken-1">{{ topic.bookmarked ? 'bookmark' : 'bookmark_border' }}</v-icon>
              </template>
            </v-btn>
          </v-layout>
        </v-card-title>

        <v-card-text v-text="topic.description" class="py-0 mb-2">
        </v-card-text>
        <v-card-text class="py-0 mb-3">
          <span class="mr-4">
            <span class="font-weight-bold">{{ topic.sheetCount['total'] }}</span> {{ topic.sheetCount['total'] == 1 ? 'contribution' : 'contributions' }} total
          </span>
          <span class="mr-4" v-if="validUser">
            <span class="font-weight-bold">{{ topic.sheetCount['following'] }}</span> from users you follow
          </span>
        </v-card-text>

        <v-card-actions>
          <v-layout d-flex align-center class="pa-0 ma-0">
            <v-btn flat color="primary" v-on:click="$router.push(topic.href)">View</v-btn>
            <v-btn v-if="validUser" flat color="primary" v-on:click="startTopicCreate(topic)">
              Create similar
            </v-btn>
          </v-layout>
        </v-card-actions>
      </v-card>
      <template v-if="topics.length % 12 != 0">
        <div v-for="spacer in (12 - topics.length % 12)" style="flex: 1 1 50% !important;"
            v-bind:key="-spacer">
        </div>
      </template>

      <v-dialog v-if="validUser" v-model="creating" content-class="xl-max6">
        <v-card>
          <v-card-title class="title font-weight-regular pb-0">
            <span style="white-space: pre-wrap">New topic </span>
            <span style="color: #1565C0;" v-text="'(' + topicToCreate.categoryTitle + ')'"></span>
          </v-card-title>
          <v-card-text id="dialog-form-container">
            <label class="subtitle grey--text">Title</label>
            <v-text-field v-model="topicToCreate.title" solo hide-details class="mb-3"></v-text-field>
            <label class="subtitle grey--text">Description</label>
            <v-text-field v-model="topicToCreate.description" solo hide-details class="mb-3"></v-text-field>
          </v-card-text>
          <v-card-actions class="justify-end">
            <v-btn flat color="primary" v-on:click="topicCreate">Create</v-btn>
            <v-btn flat color="primary" v-on:click="endTopicCreate">Cancel</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-layout>
  </v-container>
</template>

<script>
var __browseTopics = Vue.component('browse-topics', {
  template: template``,
  name: 'browse-topics',
  props: {
    validUser: Boolean,
    fontsReady: Boolean,
    userName: String
  },
  data: function() {
    return {
      creating: false,
      topicToCreate: {
        category: -1,
        categoryTitle: '',
        title: '',
        description: ''
      },
      topics: []
    }
  },
  computed: {
  },
  methods: {
    empty: empty,
    startTopicCreate: function(similar) {
      console.log(similar);
      this.topicToCreate.category = similar.category;
      this.topicToCreate.categoryTitle = similar.categoryTitle;
      this.creating = true;
    },
    topicCreate: function(category) {
      if(empty(this.topicToCreate.title, 'string') || empty(this.topicToCreate.description, 'string')) {
        // todo error message
        return;
      }
      const toSend = {
        category: this.topicToCreate.category,
        title: this.topicToCreate.title,
        description: this.topicToCreate.description
      };
      axios.post('/backend-topicdef.php', toSend)
        .then((response) => {
          if(!empty(response.data)) {
            if(response.data.topicdef) {
              this.endTopicCreate();
              loadTopics(this);
            } else if(!empty(response.data.error, 'string')) {
              // todo error message
            }
          }
        });
    },
    endTopicCreate: function() {
      this.creating = false;
      this.topicToCreate.title = '';
      this.topicToCreate.description = '';
    },
    toggleBookmark: function(topic) {
      const toSend = { topic_id: topic.id };
      axios.post('/backend-bookmark.php', toSend)
        .then(function(response) {
          if(!empty(response.data)) {
            if(response.data.topic_id === topic.id && !empty(response.data.bookmark)) {
              topic.bookmarked = response.data.bookmark;
            }
          }
        });
    }
  },
  created: function() {
    loadTopics(this);
    this.$emit('update:title', 'Browse');
  }
});

function loadTopics(vm) {
  axios.post('/backend-ls.php', { page: 'browse-main' })
    .then(function(response) {
      console.log(response.data);
      vm.topics = [];
      if(response.data.data != null) {
        Object.keys(response.data.data).forEach(function(n) {
          const topic = {
            id: response.data.data[n].topic_id,
            href: `/topic/${response.data.data[n].topic_id}`,
            name: response.data.data[n].name,
            category: response.data.data[n].category,
            categoryTitle: sheetDefinitions[response.data.data[n].category].title,
            description: response.data.data[n].description,
            bookmarked: response.data.data[n].bookmarked,
            sheetCount: {
              total: response.data.data[n].total,
              following: response.data.data[n].following
            }
          };
          vm.topics.push(topic);
        });
      }
    });
}
</script>
