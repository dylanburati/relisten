<!-- prependTo: Sheet -->
<template>
  <div class="mb-1" v-if="this.rowdata != null">
    <v-card class="elevation-2 d-flex align-center mb-1">
    <div v-if="!empty(rowdata, 'object') && sheetCols.length > 0" v-text="rowdata.num"
            class="ml-3 subheading" style="flex-grow: 0 !important;"
            v-bind:style="{'min-width': numWidth}"></div>
      <template v-for="col in sheetCols">
        <sheet-cell v-if="col.disp !== false" v-bind:key="col.n"
            v-bind:label="col.disp"
            v-model="rowdata.values[col.n]"
            v-on:focus="setFocused(true)" v-on:blur="setFocused(false)"
            v-on:input="trySearch(rowdata, col)"
            v-bind:divider="col.divider" v-bind:is-input="col.input">
        </sheet-cell>
      </template>
      <template v-if="showIndicator">
        <v-progress-circular indeterminate v-if="loading" class="flex-01" color="primary" style="width: 20px; margin: 0 10px;">
        </v-progress-circular>
        <v-icon v-else-if="rowState === 2" class="mx-2 flex-01" color="#4CAF50">check</v-icon>
        <v-icon v-else-if="!allBlank()" class="mx-2 flex-01" color="#FDD835">warning</v-icon>
        <div v-else class="flex-01" style="width: 40px"> </div>
      </template>
    </v-card>
    <v-layout d-flex v-if="focused && Array.isArray(rowdata.matches) && rowdata.matches.length > 0 && rowState < 2" class="mb-3">
      <div v-if="sheetCols.length > 0" v-text="rowdata.num"
              class="ml-3 subheading" style="flex-grow: 0 !important; visibility: hidden;"
              v-bind:style="{'min-width': numWidth}"> </div>
      <v-list class="elevation-2">
        <v-list-tile v-for="(m, i) in rowdata.matches"
            v-bind:key="i"
            v-on:click="selectMatch(m)"
            style="border-bottom: solid 1px rgba(0,0,0,.26)">
          <v-list-tile-title v-text="m.text">
          </v-list-tile-title>
        </v-list-tile>
      </v-list>
    </v-layout>
  </div>
</template>

<script>
Vue.component('sheet-row', {
  template: template``,
  props: {
    rowdata: {
      type: Object,
      required: true
    },
    sheetCols: {
      type: Array,
      required: true
    },
    validator: {
      type: Function
    },
    invalidator: {
      type: Function
    },
    search: {
      type: Function
    },
    showIndicator: {
      type: Boolean,
      default: false
    },
    totalRows: Number
  },
  data: function() {
    return {
      focused: false,
      focusChangeCounter: 0,
      rowState: 0,
      searchCounter: 0,
      loading: false
    };
  },
  computed: {
    styleObj: function() {
      if(this.rowdata == null) {
        return { display: 'none' };
      }
    },
    numWidth: function() {
      const r = Math.max(this.totalRows, 1);
      const digits = 1 + Math.floor(Math.log10(r));
      return '' + (16 + 9 * digits) + 'px';
    },
  },
  methods: {
    empty: empty,
    setFocused: function(nextVal) {
      this.focusChangeCounter++;
      if(nextVal === false) {
        const fc = this.focusChangeCounter;
        const rv = this.rowdata.values;
        const waiter = n => {
          if(this.focusChangeCounter !== fc || this.rowdata.values !== rv) {
            return;
          }
          if(n === 0) {
            this.focused = nextVal;
            return;
          }
          sleep(30).then(() => {
            waiter(n - 1);
          });
        };
        waiter(10);
      } else {
        this.focused = nextVal;
      }
    },
    selectMatch: function(match) {
      const _values = this.rowdata.values.slice();
      this.sheetCols.forEach(col => {
        if(col.field === 'id') {
          _values[col.n] = match.values[col.field];  // singular
        } else {
          _values[col.n] = match.values[col.field][0];
        }
      });
      this.rowdata.values = _values;
      this.rowState = this.validator(this.rowdata.values);
    },
    allBlank: function() {
      const filledInputs = this.sheetCols.map((col, i) => col.input && this.rowdata.values[i].length > 0)
          .filter(e => e);
      return (filledInputs.length === 0);
    },
    trySearch: function(editCol) {
      // values changed
      const sc = ++this.searchCounter;
      this.invalidator(this.rowdata.values);
      this.rowState = 0;
      if(this.allBlank()) {
        this.rowdata.matches = [];
        return;
      }
      if(typeof this.search === 'function') {
        this.loading = true;
        this.search(this.rowdata, docs => {
          if(this.searchCounter === sc) {
            this.rowdata.matches = docs;
            this.loading = false;
          }
        });
      }
    }
  },
  created: function() {
    this.rowState = this.validator(this.rowdata.values);
  }
});
</script>
