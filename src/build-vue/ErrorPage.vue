<!-- prependTo: Dashboard -->
<template>
  <v-container fluid>
    <div class="mt-3 mb-2">
      <h2 class="mb-2 font-weight-regular" style="font-size: 28px;">Error</h2>
      <p>{{ errorText }}</p>
    </div>
  </v-container>
</template>

<script>
const errors = {
  2: 'Your sheet was not found. Please try again.',
  3: 'User does not exist.',
  4: 'Topic does not exist.',
  6: "Can't create sheet: unknown category.",
  404: 'The requested page does not exist.',
  500: 'The server encountered an error.'
};

var __errorPage = Vue.component('error-page', {
  template: template``,
  name: 'error-page',
  props: {
    validUser: Boolean,
    fontsReady: Boolean,
    userName: String,
    errorCode: Number
  },
  computed: {
    errorText: function() {
      return errors[this.errorCode] || 'An unexpected error occurred';
    }
  },
  created: function() {
    this.$emit('update:title', 'Error');
  }
});
</script>