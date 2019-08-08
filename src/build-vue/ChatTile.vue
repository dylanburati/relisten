<!-- prependTo: Sidebar -->
<template>
  <router-link tag="li" class="chat-tile hoverable" v-bind:to="to">
    <h4 class="mb-1">{{ title }}</h4>
    <p class="mb-0">{{ subtitle }}</p>
  </router-link>
</template>

<script>

Vue.component('chat-tile', {
  template: template``,
  name: 'chat-tile',
  props: {
    title: String,
    subtitle: String,
    to: String
  }
});
</script>