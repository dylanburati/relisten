<!-- prependTo: SheetRow -->
<template>
  <span v-if="isInput" v-bind:class="{'pr-1': divider}">
    <div class="v-input v-text-field v-text-field--box v-text-field--enclosed
  v-text-field--placeholder v-input--hide-details v-input--is-label-active v-input--is-dirty theme--light">
      <div class="v-input__control">
        <div class="v-input__slot">
          <div class="v-text-field__slot">
          <input type="text" v-bind:aria-label="label" v-bind:placeholder="label"
              v-bind:value="value" v-on:input="$emit('input', $event.target.value)"
              v-on:focus="$emit('focus', $event)" v-on:blur="$emit('blur', $event)">
          </div>
        </div>
      </div>
    </div>
  </span>
  <div v-else class="mx-3 flex-01">
    {{ value }}
  </div>
</template>

<script>
Vue.component('sheet-cell', {
  template: template``,
  name: 'sheet-cell',
  props: {
    value: String,
    label: {
      type: String,
      required: true
    },
    isInput: Boolean,
    divider: Boolean
  }
});
</script>