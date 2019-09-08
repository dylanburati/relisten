<template>
  <v-container id="container-main" v-bind:class="[$vuetify.breakpoint.mdAndUp ? 'px-4' : 'px-3']"
          v-bind:style="{'padding-top': ($vuetify.breakpoint.mdAndUp ? '76px' : '68px')}">
    <v-layout d-flex align-center class="mt-2 mb-3" id="sheet-header">
      <v-icon v-if="fontsReady && !saving && !submitting" v-on:click="startSheetSave(true)"
              class="mr-1 grey--text text--darken-1 icon-sm">
        edit
      </v-icon>
      <h2 v-if="!saving" class="headline pr-2" id="sheet-title" v-text="(!empty(sheetTitle, 'string') ? sheetTitle : 'New sheet')">New sheet</h2>
      <v-text-field v-if="saving" v-model="sheetTitle" prepend-icon="cancel" @click:prepend="endSheetSave"
            autofocus solo hide-details label="Title" color="grey darken-1" style="max-width: 480px;">
      </v-text-field>
      <v-spacer></v-spacer>
      <v-btn class="btn-dense border-radius-r0" color="primary" v-bind:disabled="submitting"
          style="flex-grow: 0 !important;" v-on:click="startSheetSave(false)">
        Save
        <v-icon v-if="fontsReady" class="pl-2">save</v-icon>
      </v-btn>
      <v-dialog v-if="validUser" v-model="submitting" content-class="xl-max6">
        <v-btn slot="activator" class="btn-dense border-radius-l0" v-bind:dark="!saving" color="#343a4a" v-bind:disabled="saving"
            style="flex-grow: 0 !important; padding-right: 12px !important;">
          Submit
          <v-icon v-if="fontsReady" class="pl-2">forward</v-icon>
        </v-btn>
        <v-card>
          <v-card-title class="title font-weight-regular pb-0">
            Submit
          </v-card-title>
          <v-card-text id="dialog-searchbar-container">
            <label class="subtitle grey--text">Title</label>
            <v-text-field v-model="sheetTitle" solo hide-details class="mb-3"></v-text-field>
            <label class="subtitle grey--text">Privacy</label>
            <v-select v-model="sheetPrivacy" v-bind:items="sheetPrivacyOptions" solo hide-details class="mb-4" label="Privacy"></v-select>
            <v-overflow-btn ref="dialog-searchbar" v-model="dialogSelectTopic" v-bind:items="dialogSearchResults"
                    v-bind:search-input.sync="dialogSearchTerm" hide-no-data no-filter v-bind:segmented="false"
                    autofocus editable solo hide-details placeholder="Select topic"
                    v-bind:menu-props="{ 'contentClass': 'navbar-search-results' }" id="dialog-searchbar">
              <template v-slot:item="data">
                <v-list-tile-content v-text="data.item.text"></v-list-tile-content>
              </template>
            </v-overflow-btn>
          </v-card-text>
          <v-card-actions class="justify-end">
            <v-btn flat color="primary" v-on:click="sheetSubmit">Submit</v-btn>
            <v-btn flat color="primary" v-on:click="endSheetSubmit">Cancel</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-layout>

    <draggable v-model="sheetRows" v-bind:clone="o => Object.assign({}, o)"
            v-bind:options="{ group: 'main', filter: '.v-input, .v-list__tile', preventOnFilter: false }"
            v-on:end="draggableMoveEnd">
      <sheet-row v-for="row in sheetRows" v-bind:key="row.num" v-bind:rowdata="row"
          v-bind:sheet-cols="sheetCols" v-bind:total-rows="sheetRows.length"
          v-bind:search="sheetSearchSync"
          v-bind:show-indicator="typeof sheetUtil.makeQuery === 'function'"
          v-bind:validator="sheetUtil.getRowState"
          v-bind:invalidator="sheetUtil.resetRowState"
          ref="sheet-rows" class="sheet-row">
      </sheet-row>
    </draggable>

    <v-layout d-flex>
      <v-btn v-on:click="appendSheetRows(10)"
              class="btn-group-bg200" style="flex: 1 1 !important;" v-bind:ripple="false">
        Add 10 Rows
      </v-btn>
    </v-layout>
  </v-container>
</template>
  
<script>
function autoMatch(columnMap) {
  if(vm.sheetVerify.type !== 'solr') return;
  let i = 0;
  if(empty(columnMap)) {
    columnMap = vm.sheetVerify.fields.map(e => [e, vm.sheetCols.findIndex(e2 => (e2.field === e))]);
  }
  while(vm.sheetRows[i].finalize !== 0) {
    if(vm.sheetRows[i].finalize === 2) {
      for(let match of vm.sheetRows[i].matches) {
        let correct = true;
        for(let col of columnMap) {
          if(match.values[col[0]] !== vm.sheetRows[i].values[col[1]] &&
                  (vm.sheetCols[col[1]].dtype !== 's' || match.values[col[0]].toLowerCase() !== vm.sheetRows[i].values[col[1]].toLowerCase())) {
            correct = false;
            break;
          }
        }
        if(correct) {
          window.scrollTo(0, Math.max(0, vm.$refs['sheet-rows'][i].$el.offsetTop - 300));
          vm.$refs['sheet-rows'][i].selectMatch(match);
          break;
        }
      }
    }
    i++;
    if(i === vm.sheetRows.length) return;
  }
  vm.$refs['sheet-rows'][i].tryVerify();
  sleep(300).then(() => autoMatch(columnMap));
}

function finalizeData(vm) {
  if(!Array.isArray(vm.sheetRows) || vm.sheetUtil == null) {
    return false;
  }

  let allValid = vm.sheetRows.map(row => vm.sheetUtil.validateRow(row.values))
      .filter(e => e !== false);

  if(vm.sheetUtil.uniqueIndex >= 0) {
    const hash = {}
    for(let i = allValid.length - 1; i >= 0; i--) {
      const uniqueKey = allValid[i][vm.sheetUtil.uniqueIndex];
      hash[uniqueKey] = i;
    }
    const uniqueRows = Object.values(hash);
    uniqueRows.sort((a, b) => a - b);
    allValid = uniqueRows.map(r => allValid[r]);
  }

  return allValid;
}

var __sheet = Vue.component('sheet', {
  template: template``,
  name: 'sheet',
  props: {
    validUser: Boolean,
    fontsReady: Boolean,
    userName: String,
    newSheet: Boolean,
    sheetId: Number,
    requestCategory: Number
  },
  data: function() {
    return {
      sheetCategory: null,
      sheetTitle: null,
      saving: false,
      submitting: false,
      submitOnSave: false,
      sheetPrivacyOptions: [
        { text: 'Public', value: 0 },
        { text: 'Visible to followers', value: 1 },
        { text: 'Unlisted', value: 2 }
      ],
      sheetPrivacy: null,
      dialogSearchTerm: '',
      dialogSelectTopic: null,
      dialogSearchResults: [],
      // ----- //
      chunkSize: 50,
      sheetRows: [],
      sheetCols: [],
      sheetUtil: null
    }
  },
  computed: {
  },
  watch: {
    dialogSearchTerm: function(v) {
      if(empty(v, 'string')) {
        this.dialogSearchResults = [];
        return;
      }
      debounce.invoke(this.getDialogSearchResults, [v, this.dialogSearchResults], 100);
    },
    sheetTitle: function(v) {
      this.$emit('update:title', v);
    },
    sheetId: function(v) {
      if(this.newSheet) {
        makeSheetContent(this);
      } else {
        loadSheetContent(this);
      }
    }
  },
  methods: {
    empty: empty,
    searchExtension: function(v) {
      if(v.toLowerCase().startsWith('sicko mode')) {
        autoMatch();
        return true;
      }
      const delMatch = /^:([0-9]+)(,([0-9]+)?)?d$/.exec(v);
      if(delMatch != null) {
        let startNum = parseInt(delMatch[1]);
        let endNum = startNum;
        if(!empty(delMatch[2])) {
          if(empty(delMatch[3])) {
            endNum = this.sheetRows.length;
          } else {
            endNum = parseInt(delMatch[3]);
          }
        }
        if(!empty(startNum, 'number') && !empty(endNum, 'number') && endNum >= startNum) {
          this.dropSheetRows(startNum - 1, endNum - 1);
          return true;
        }
      }
      const randomizeMatch = /^:([0-9]+)(,([0-9]+)?)rand$/.exec(v);
      if(randomizeMatch != null) {
        let startNum = parseInt(randomizeMatch[1]);
        let endNum = startNum;
        if(!empty(randomizeMatch[2])) {
          if(empty(randomizeMatch[3])) {
            endNum = this.sheetRows.length;
          } else {
            endNum = parseInt(randomizeMatch[3]);
          }
        }
        if(!empty(startNum, 'number') && !empty(endNum, 'number') && endNum > startNum) {
          this.randomizeSheetRows(startNum - 1, endNum - 1);
          return true;
        }
      }
      return false;
    },
    getDialogSearchResults: function(q, resultsRef) {
      axios.post('/backend-search.php', { search: true, q: q, restrict: 'topic' })
        .then((response) => {
          if(Array.isArray(response.data.data)) {
            resultsRef.splice(0);
            response.data.data.forEach(row => {
              if(row.category !== this.sheetCategory) {
                return;
              }
              const searchResult = Object.assign({}, row, { n: resultsRef.length });
              resultsRef.push(searchResult);
            });
          }
        });
    },
    draggableMoveEnd: function(event) {
      const prev = event.oldIndex;
      const curr = event.newIndex;
      if(curr > prev) {
        for(let i = prev; i <= curr; i++) {
          this.sheetRows[i].num = i + 1;
        }
      } else if(curr < prev) {
        for(let i = curr; i <= prev; i++) {
          this.sheetRows[i].num = i + 1;
        }
      }
    },
    dropSheetRows: function(startIdx, endIdx) {
      let _sheetRows = this.sheetRows.slice();
      const dropLen = endIdx - startIdx + 1;  // both indices inclusive
      _sheetRows.splice(startIdx, dropLen);
      _sheetRows = _sheetRows.map((e, i) => Object.assign({}, e, { num: i + 1 }));
      this.sheetRows = _sheetRows;
    },
    appendSheetRows: function(n) {
      let _sheetRows = this.sheetRows.slice();
      const startIdx = _sheetRows.length;
      for(let i = startIdx; i < startIdx + n; i++) {
        const rowObj = {
          num: i + 1,
          values: this.sheetUtil.emptyRowValues(),
          matches: []
        };
        _sheetRows.push(rowObj);
      }
      this.sheetRows = _sheetRows;
    },
    randomizeSheetRows: function(startIdx, endIdx) {
      let toRandomize = this.sheetRows.slice(startIdx, endIdx + 1);
      let useRows = randomizeUnweighted(toRandomize);
      useRows = useRows.map((e, i) => Object.assign({}, e, { num: startIdx + i + 1 }));
      this.sheetRows = this.sheetRows.slice(0, startIdx).concat(useRows).concat(this.sheetRows.slice(endIdx + 1));
    },
    startSheetSave: function(rename) {
      if(!rename && !empty(this.sheetTitle, 'string') && this.sheetTitle !== 'New sheet') {
        // Todo
        this.sheetSave();
      } else {
        this.saving = true;
      }
    },
    sheetSave: function() {
      if(this.submitOnSave !== false) {
        this.dialogSelectTopic = this.submitOnSave;
        this.sheetSubmit();
        return;
      }
      const serializedSheetRows = this.sheetRows.map(e => e.values);
      const toSend = {
        title: this.sheetTitle,
        category: this.sheetCategory,
        sheetData: serializedSheetRows
      };
      if(this.sheetId >= 0) {
        toSend.sheetId = this.sheetId;
      } else {
        toSend.create = true;
      }

      axios.post('/backend-save.php', toSend)
        .then((response) => {
          console.log(response.data);
          if(!empty(response.data, 'object') && response.data.id > 0) {
            if(this.sheetId !== response.data.id) {
              this.$router.push(`/sheet/${response.data.id}`);
            }
          }
          this.endSheetSave();
        });
    },
    endSheetSave: function() {
      this.saving = false;
    },
    sheetSubmit: function() {
      if(this.sheetPrivacy == null || !(this.sheetId >= 0)) {
        return false;
      }
      const privacy = this.sheetPrivacy;
      const serializedSheetRows = this.sheetRows.map(e => e.values);
      const finalizedSheetRows = finalizeData(this);
      const toSend1 = {
        sheetId: this.sheetId,
        title: this.sheetTitle,
        category: this.sheetCategory,
        sheetData: serializedSheetRows
      };
      const toSend2 = {
        sheetId: this.sheetId,
        topic: this.dialogSelectTopic,
        category: this.sheetCategory,
        sheetData: finalizedSheetRows,
        sheetPrivacy: privacy
      };
      axios.post('/backend-save.php', toSend1)
        .then((response) => {
          console.log(response.data);
          if(!empty(response.data, 'object') && response.data.id > 0) {
            this.sheetId = response.data.id;
            toSend2.sheetId = response.data.id;
          }

          axios.post('/backend-submit.php', toSend2)
            .then((response) => {
              console.log(response.data);
              if(!empty(response.data, 'object') && response.data.finalize === true) {
                this.submitOnSave = toSend2.topic;
              }
              this.endSheetSave();
              this.endSheetSubmit();
            });
        });
    },
    endSheetSubmit: function() {
      this.submitting = false;
      this.dialogSelectTopic = null;
    },
    sheetSearchSync: function(rowdata, callback) {
      if(typeof this.sheetUtil.makeQuery === 'function') {
        const qData = this.sheetUtil.makeQuery(rowdata.values);
        throttle.invoke(this.sheetSearch, [qData, callback], 300);
      }
    },
    sheetSearch: function(qData, callback) {
      axios.post("/backend-verify.php", qData)
        .then((response) => {
          console.log(response.data);
          const matches = [];
          if(!empty(response.data.response, 'object') && !empty(response.data.response.docs)) {
            const len = Math.min(5, response.data.response.docs.length);
            for(let i = 0; i < len; i++) {
              const matchValues = {};
              Object.keys(response.data.response.docs[i]).forEach(k => {
                if(this.sheetCols.findIndex(e => (e.field === k)) !== -1) {
                  matchValues[k] = response.data.response.docs[i][k];
                }
              });
              matches.push({ values: matchValues, text: this.sheetUtil.objToString(matchValues) });
            }
          }
          callback(matches);
        }, (error) => callback([]));
    }
  },
  created: function() {
    this.$emit('update:search-extension', this.searchExtension.bind(this));
    if(this.newSheet) {
      makeSheetContent(this);
    } else {
      loadSheetContent(this);
    }
  },
  mounted: function() {
    this.$nextTick(() => {
      this.sheetPrivacy = this.sheetPrivacyOptions[0].value;
    });
  }
});

function makeSheetContent(vm) {
  vm.sheetUtil = sheetDefinitions[vm.requestCategory];
  if(vm.sheetUtil == null) {
    vm.$router.push('/error/6');
  }
  vm.sheetCategory = vm.requestCategory;
  const sheetCols = vm.sheetUtil.columns.slice();
  const inputCols = sheetCols.filter(col => col.input);
  sheetCols.forEach((col) => {
    col.divider = (inputCols.indexOf(col) < inputCols.length - 1);
  });
  vm.sheetCols = sheetCols;
  vm.appendSheetRows(50);
}

function loadSheetContent(vm) {
  axios.post('/backend-load.php', { sheetId: vm.sheetId })
    .then(function(response) {
      console.log(response.data);
      if(response.data.error != null) {
        vm.$router.push('/error/2');
      }
      vm.sheetRows = [];
      vm.sheetCategory = response.data.category;
      vm.sheetUtil = sheetDefinitions[response.data.category];

      const sheetCols = vm.sheetUtil.columns.slice();
      const inputCols = sheetCols.filter(col => col.input);
      sheetCols.forEach((col) => {
        col.divider = (inputCols.indexOf(col) < inputCols.length - 1);
      });
      vm.sheetCols = sheetCols;

      if(!empty(response.data.topic, 'object')) {
        vm.submitOnSave = response.data.topic.name;
        vm.sheetPrivacy = vm.sheetPrivacyOptions.find(e => (e.value === response.data.topic.privacy));
      }
      if(!empty(response.data.title, 'string')) {
        vm.sheetTitle = response.data.title;
      }
      if(!empty(response.data.data, 'array')) {
        const renderFn = startIndex => {
          const sheetRowsBuilder = [];
          let i = startIndex;
          let end = Math.min(startIndex + vm.chunkSize, response.data.data.length);
          for(/* i = startIndex */; i < end; i++) {
            const row = response.data.data[i];
            const rowObj = { num: row.num, values: row.values, matches: [] };
            rowObj.finalize = vm.sheetUtil.getRowState(row.values);
            sheetRowsBuilder.push(rowObj);
          }
          vm.sheetRows = vm.sheetRows.concat(sheetRowsBuilder);
          if(i < response.data.data.length) {
            window.setTimeout(() => renderFn(i), 0);
          }
        };
        window.setTimeout(() => renderFn(0), 0);
      } else {
        vm.appendSheetRows(50);
      }
    });
}
</script>
