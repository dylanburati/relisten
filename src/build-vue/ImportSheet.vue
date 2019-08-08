<template>
  <v-container id="container-main" v-bind:class="[$vuetify.breakpoint.mdAndUp ? 'px-4' : 'px-3']"
      fill-height>
    <v-layout column>
      <v-layout align-center class="flex-01 mt-2 mb-1" id="sheet-header">
        <v-icon v-if="fontsReady && !saving" v-on:click="startSheetSave(true)"
                class="mr-1 grey--text text--darken-1 icon-sm">
          edit
        </v-icon>
        <h2 v-if="!saving" class="headline pr-2" id="sheet-title" v-text="(!empty(sheetTitle, 'string') ? sheetTitle : 'New sheet')">New sheet</h2>
        <v-text-field v-if="saving" v-model="sheetTitle" prepend-icon="cancel" @click:prepend="endSheetSave"
              autofocus solo hide-details label="Title" color="grey darken-1" style="max-width: 480px;">
        </v-text-field>
        <v-spacer></v-spacer>
        <v-btn class="btn-dense flex-01" color="primary" v-bind:disabled="!saveReady"
                v-on:click="startSheetSave(false)">
          Import
        </v-btn>
      </v-layout>
      <v-layout class="flex-01 mb-3" id="sheet-header-2">
        <label class="v-label mr-2" for="category-select">Category:</label>
        <v-select box v-model="sheetCategory" v-bind:items="sheetCategoryOptions" id="category-select"
                hint="Select one" persistent-hint
                hide-details v-bind:menu-props="{ 'contentClass': 'list-dense' }"
                v-attach-html-attribute.global="{ '#category-select': {'disabled': 'true' }}">
        </v-select>
      </v-layout>
      <v-layout class="flex-01 mb-1 px-2 py-1" style="background-color: rgba(255,0,0,.16);" v-show="!empty(importErrorMsg, 'string')">
        <p class="ma-0" v-text="importErrorMsg"></p>
      </v-layout>
      <v-layout d-block id="import-textarea-container" style="overflow: hidden;">
        <v-textarea outline no-resize v-model="preImport" label="Paste from Google Sheets"
                class="flex-11" id="import-textarea">
        </v-textarea>
      </v-layout>
    </v-layout>
  </v-container>
</template>

<script>
Vue.directive('attach-html-attribute', {
  update: function(el, binding, vnode) {
    if(empty(binding.value, 'object')) return;
    Object.keys(binding.value).forEach(id => {
      if(empty(binding.value[id], 'object')) return;
      let targetEl;
      if(binding.modifiers.global) {
        targetEl = document.querySelector(id);
      } else {
        targetEl = el.querySelector(id);
      }
      if(empty(targetEl)) return;
      Object.keys(binding.value[id]).forEach(prop => targetEl[prop] = binding.value[id][prop]);
    });
  }
});

function tryParseTSV(vm) {
  if(vm.preImport === '') {
    return 'Please add at least one line to the textbox';
  }
  if(vm.sheetUtil == null) {
    return 'Please select a category';
  }

  const lines = vm.preImport.split('\n');
  let sheetRows = lines.map(row => (row !== '' ? row.split('\t') : []))
    .filter(row => row.length > 0);
  let numIncluded = true;
  const inputColCount = vm.sheetUtil.columns.filter(c => c.input).length;
  const errorLines = [];
  for(let i = 0; i < sheetRows.length; i++) {
    if(numIncluded && Number.isNaN(parseInt(sheetRows[i][0], 10))) {
      numIncluded = false;
    }
    if(sheetRows[i].length !== inputColCount &&
        (!numIncluded || sheetRows[i].length !== inputColCount + 1)) {
      errorLines.push(i);
    }
  }
  if(errorLines.length > 0) {
    if(errorLines.length > 2) {
      return `${errorLines.length} errors. Please make sure you picked the right category.`;
    } else {
      return errorLines.map(l => `Wrong number of fields in this line: "${lines[l]}"`).join('\n');
    }
  }
  sheetRows = sheetRows.map(row => {
    const full = vm.sheetUtil.emptyRowValues();
    vm.sheetUtil.columns.forEach((col, j) => {
      if(col.input) {
        full[j] = row[j];
      }
    });
    return full;
  });
  return sheetRows;
}

var __importSheet = Vue.component('import-sheet', {
  template: template``,
  name: 'import-sheet',
  props: {
    validUser: Boolean,
    fontsReady: Boolean,
    userName: String,
  },
  data: function() {
    return {
      sheetCategory: -1,
      sheetCategoryOptions: Object.keys(sheetDefinitions).map(id => ({
        text: sheetDefinitions[id].title,
        value: parseInt(id, 10)
      })),
      importErrorMsg: '',
      sheetTitle: null,
      saving: false,
      preImport: null
    }
  },
  computed: {
    sheetUtil: function() {
      return sheetDefinitions[this.sheetCategory];
    },
    saveReady: function() {
      return (this.sheetCategory >= 0 && !empty(this.preImport, 'string') &&
          this.preImport.indexOf('\n') !== -1 && (/[^\s]/).test(this.preImport));
    }
  },
  watch: {
    dialogSearchTerm: function(v) {
      if(empty(v, 'string')) {
        this.dialogSearchResults = [];
        return;
      }
      debounce.invoke(this.getDialogSearchResults, [v, this.dialogSearchResults], 100);
    }
  },
  methods: {
    empty: empty,
    startSheetSave: function(rename) {
      if(!rename && !empty(this.sheetTitle, 'string')) {
        this.sheetSave();
      } else {
        this.saving = true;
      }
    },
    sheetSave: function() {
      const sheetRows = tryParseTSV(this);
      if(typeof sheetRows === 'string') {
        this.importErrorMsg = sheetRows;
        return;
      } else if(!Array.isArray(sheetRows)) {
        this.importErrorMsg = 'Unknown error';
        return;
      }

      const toSend = {
        title: this.sheetTitle,
        category: this.sheetCategory,
        sheetData: sheetRows,
        create: true
      };
      axios.post('/backend-save.php', toSend)
        .then((response) => {
          console.log(response.data);
          if(!empty(response.data, 'object') && response.data.id > 0) {
            this.$router.push(`/sheet/${response.data.id}`);
          }
        });
    },
    endSheetSave: function() {
      this.saving = false;
    }
  },
  created: function() {
    this.$emit('update:title', 'Import');
  },
  mounted: function() {
    this.$nextTick(() => {
      this.sheetCategory = this.sheetCategoryOptions[0].value;
    });
  }
});
</script>
