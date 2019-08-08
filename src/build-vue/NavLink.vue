<!-- prependTo: Dashboard -->
<template>
  <li class="nav-link-container" v-bind:style="styleObj"
      v-on:click="navLinkPassThrough">
    <a v-if="this.linkdata.noRouter" class="nav-link" v-bind:class="{active: active}" v-bind:href="linkdata.href">
      {{ linkdata.text }}
    </a>
    <router-link v-else class="nav-link" v-bind:class="{active: active}" v-bind:to="linkdata.href">
      {{ linkdata.text }}
    </router-link>
  </li>
</template>

<script>
Vue.component('nav-link', {
  template: template``,
  name: 'nav-link',
  props: {
    linkdata: {
      type: Object,
      required: true
    },
    right: Boolean,
    active: Boolean
  },
  computed: {
    styleObj: function() {
      if(!this.right) {
        return {
          'padding': '.25rem .25rem .25rem 1.5rem',
        };
      }
      return {
        'text-align': 'right',
        'padding': '.25rem 1rem .25rem 1rem',
      };
    }
  },
  methods: {
    navLinkPassThrough: function() {
      if(typeof this.linkdata.action === 'function') {
        this.linkdata.action();
      }
      if(this.linkdata.href != null && this.linkdata.href !== '') {
        this.$el.querySelector('a').click();
      }
    }
  }
});
</script>