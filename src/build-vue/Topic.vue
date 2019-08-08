<template>
  <v-container>
    <v-layout d-flex align-center class="my-3">
      <h2 class="headline pr-2" v-text="topicName"></h2>
      <v-spacer></v-spacer>
    </v-layout>
    <v-toolbar color="#DAE0E4" id="topic-header" class="my-3">
      <v-tabs v-model="activeTab" color="#DAE0E4" slider-color="primary">
        <v-tab v-for="(tab, n) in tabs" v-bind:key="n">
          {{ tab.text }}
        </v-tab>
      </v-tabs>
      <v-layout d-flex column slot="extension" v-if="activeTab === 0" class="pa-2">
        <v-select v-model="selectVisibleCombine" v-bind:items="selectVisibleCombineOptions"
                solo v-bind:menu-props="{ 'contentClass': 'list-dense' }">
        </v-select>
        <template v-if="selectVisibleCombine === 2">
          <v-autocomplete ref="dialog-searchbar" id="dialog-searchbar"
              v-model="selectUsersCombine"
              v-bind:items="topicContributorItems"
              cache-items
              chips multiple deletable-chips hide-selected
              solo hide-no-data hide-details label="Select users" aria-label="Select users"
              v-bind:menu-props="{ 'contentClass': 'navbar-search-results' }">
            <template v-slot:item="data">
              <v-list-tile-content v-text="data.item.text"></v-list-tile-content>
            </template>
          </v-autocomplete>
        </template>
      </v-layout>
      <v-layout d-flex slot="extension" v-if="activeTab === 1" class="pa-2">
        <v-flex xs6>
          <v-autocomplete ref="dialog-searchbar-compare1" id="dialog-searchbar-compare1"
              v-model="selectUserCompare1"
              v-bind:items="topicContributorItems"
              solo hide-no-data hide-details label="Select user"
              v-bind:menu-props="{ 'contentClass': 'navbar-search-results' }">
            <template v-slot:item="data">
              <v-list-tile-content v-text="data.item.text"></v-list-tile-content>
            </template>
          </v-autocomplete>
        </v-flex>
        <v-flex xs6>
          <v-autocomplete ref="dialog-searchbar-compare2" id="dialog-searchbar-compare2"
              v-model="selectUserCompare2"
              v-bind:items="topicContributorItems"
              solo hide-no-data hide-details label="Select user"
              v-bind:menu-props="{ 'contentClass': 'navbar-search-results' }">
            <template v-slot:item="data">
              <v-list-tile-content v-text="data.item.text"></v-list-tile-content>
            </template>
          </v-autocomplete>
        </v-flex>
      </v-layout>
    </v-toolbar>

    <v-tabs-items v-model="activeTab">
      <v-tab-item v-bind:key="0">
        <v-data-table hide-no-data hide-actions class="topic-data datatable"
                v-bind:headers="topicHeadersCombine" v-bind:items="topicVisibleRowsCombine">
          <template v-slot:items="props">
            <td v-for="column in topicHeadersCombine" v-text="props.item[column.value]"
                v-bind:key="column.value"
                v-bind:class="{ 'text-xs-right': (column.align === 'right') }"></td>
          </template>
        </v-data-table>
      </v-tab-item>
      <v-tab-item v-bind:key="1">
        <v-data-table hide-no-data hide-actions class="topic-data datatable"
                v-bind:headers="topicHeadersCompare" v-bind:items="topicVisibleRowsCompare">
          <template v-slot:items="props">
            <td v-for="column in topicHeadersCompare" v-text="props.item[column.value]"
                v-bind:key="column.value"
                v-bind:class="{ 'data-border-left': (column.border === 'left'), 'text-xs-right': (column.align === 'right') }"></td>
          </template>
        </v-data-table>
      </v-tab-item>
    </v-tabs-items>
  </v-container>
</template>
  
<script>
var __topic = Vue.component('topic', {
  template: template``,
  name: 'topic',
  props: {
    validUser: Boolean,
    fontsReady: Boolean,
    userName: String,
    topicId: Number,
    requestUsername: String
  },
  data: function() {
    return {
      topicName: '',
      activeTab: 0,
      tabs: [
        { text: 'Combine' },
        { text: 'Compare' }
      ],
      consensusIncrement: 1.25,
      selectVisibleCombine: 0,
      selectUsersCombine: [],
      dialogSearchTermCombine: '',
      topicContributorsDialogCombine: [],
      selectUserCompare1: null,
      selectUserCompare2: null,
      dialogSearchTermCompare1: '',
      topicContributorsDialogCompare1: [],
      dialogSearchTermCompare2: '',
      topicContributorsDialogCompare2: [],
      // ----- //
      following: [],
      topicContributors: {},
      uniqueIndex: -1,
      topicCols: [],
      topicHeadersCombine: [],
      topicHeadersCompare: [],
      topicRows: [],
      topicVisibleRowsCombine: [],
      topicVisibleRowsCompare: []
    }
  },
  computed: {
    topicContributorItems: function() {
      return Object.keys(this.topicContributors).map(e => ({
        text: '@' + e,
        value: e
      }));
    },
    selectVisibleCombineOptions: function() {
      let opts = [
        { text: 'All users', value: 0 },
        { text: 'Only users I follow', value: 1 },
        { text: 'Custom', value: 2 }
      ];

      if(!this.validUser) {
        opts.splice(1, 1);
      }
      return opts;
    }
  },
  watch: {
    dialogSearchTermCombine: function(q) {
      if(q === this.selectUserCombine || q === '@' + this.selectUserCombine) {
        this.topicContributorsDialogCombine = this.getDialogSearchResults('');
      } else {
        this.topicContributorsDialogCombine = this.getDialogSearchResults(q);
      }
    },
    dialogSearchTermCompare1: function(q) {
      if(q === this.selectUserCompare1 || q === '@' + this.selectUserCompare1) {
        this.topicContributorsDialogCompare1 = this.getDialogSearchResults('');
      } else {
        this.topicContributorsDialogCompare1 = this.getDialogSearchResults(q);
      }
    },
    dialogSearchTermCompare2: function(q) {
      if(q === this.selectUserCompare2 || q === '@' + this.selectUserCompare2) {
        this.topicContributorsDialogCompare2 = this.getDialogSearchResults('');
      } else {
        this.topicContributorsDialogCompare2 = this.getDialogSearchResults(q);
      }
    },
    selectUsersCombine: function(v) {
      this.getVisibleRowsCombine();
    },
    selectVisibleCombine: function(v) {
      this.getVisibleRowsCombine();
    },
    selectUserCompare1: function(v) {
      this.getVisibleRowsCompare(1);
    },
    selectUserCompare2: function(v) {
      this.getVisibleRowsCompare(2);
    },
    topicId: function(v) {
      loadTopicContent(this);
    },
    topicName: function(v) {
      this.$emit('update:title', v);
    }
  },
  methods: {
    empty: empty,
    setDialogSearchbarSelected: function() {
      if(!empty(this.$refs['dialog-searchbar'], 'object')) {
        const itemList = this.selectUsersCombine.filter(u => Object.keys(this.topicContributors).indexOf(u) !== -1).
                map(e => ({ text: '@' + e, value: e }));
        console.log(itemList);
        this.$refs['dialog-searchbar'].selectedItems = itemList;
      }
    },
    filterTopicContributors: function(item, q, itemText) {
      let userList = [];
      if(q === '') {
        return true;
      } else {
        userList = Object.keys(this.topicContributors).map(u => ({ text: '@' + u, value: u, relevance: getRelevance(u, q) }))
                .filter(r => !Number.isNaN(r.relevance));
        userList.sort((a, b) => (a.relevance > b.relevance ? -1 : 1));
        userList.splice(5);
        userList = userList.map(e => ({ text: e.text, value: e.value }));
      }
      return userList;
    },
    getVisibleRows: function() {
      if(this.activeTab === 0) {
        this.getVisibleRowsCombine();
      } else {
        this.getVisibleRowsCompare(1);
        this.getVisibleRowsCompare(2);
      }
    },
    getVisibleRowsCombine: function() {
      let parsed = new Array(this.topicRows.length).fill(false);
      const vRowArr = [];

      const consensusConst = ((this.consensusIncrement - 1) * 2) / (2 - this.consensusIncrement);
      const consensusFn = (n) => (n / (consensusConst + n));

      this.topicRows.forEach((row, i) => {
        if(parsed[i]) {
          return;
        }
        const current = this.topicRows.map(row2 => {
          if(this.selectVisibleCombine === 0 ||
            (this.selectVisibleCombine === 1 && this.following.indexOf(row2.username) !== -1) ||
            (this.selectVisibleCombine === 2 && this.selectUsersCombine.indexOf(row2.username) !== -1)) {

            if(this.uniqueIndex >= 0) {
              if(row2.values[this.uniqueIndex] === row.values[this.uniqueIndex]) {
                return [row2.username, row2.num];
              } else {
                return false;
              }
            } else {
              for(let j = 0; j < row2.values.length; j++) {
                if(row2.values[j] !== row.values[j]) {
                  return false;
                }
              }
              return [row2.username, row2.num];
            }
          } else {
            return null;  // parsed but not included
          }
        });
        parsed = parsed.map((p, i2) => p || current[i2] !== false);

        const rowObj = {};
        for(let j = 0; j < row.values.length; j++) {
          rowObj['values' + j] = row.values[j];
        }
        // console.log(current.filter(ec => (ec !== false && ec !== null)));
        rowObj.num = current.filter(ec => (ec !== false && ec !== null)).map(ec => {
          const count = this.topicContributors[ec[0]];
          if(count === 1) {
            return 1;
          } else {
            return (count - ec[1]) / (count - 1);
          }
        });
        if(rowObj.num.length > 0) {
          rowObj.num = rowObj.num.reduce((acc, cur, j, arr) => (acc + cur * consensusFn(arr.length) / arr.length), 0);
          vRowArr.push(rowObj);
        }
      });
      vRowArr.sort((a, b) => (a.num > b.num ? -1 : 1));

      for(let j = 0; j < vRowArr.length; j++) {
        vRowArr[j].num = j + 1;
      }
      this.topicVisibleRowsCombine = vRowArr;
    },
    getVisibleRowsCompare: function(n) {
      let vRowArr = [];
      if(n === 1) {
        if(empty(this.selectUserCompare1, 'string')) return;
        vRowArr = this.topicRows.filter(e => e.username === this.selectUserCompare1).map(e => {
          let rowObj = { num: e.num };
          const prev_r = this.topicVisibleRowsCompare.find(prev_e => prev_e.num === e.num);
          if(prev_r != null) {
            rowObj = Object.assign({}, rowObj, prev_r);
          } else {
            this.topicCols.filter(col => col.disp).forEach((col, j) => {
              rowObj['valuesB' + j] = '';
            });
          }
          for(let j = 0; j < e.values.length; j++) {
            rowObj['values' + j] = e.values[j];
          }
          return rowObj;
        });
      } else if(n === 2) {
        if(empty(this.selectUserCompare2, 'string')) return;
        vRowArr = this.topicRows.filter(e => e.username === this.selectUserCompare2).map(e => {
          let rowObj = { num: e.num };
          const prev_r = this.topicVisibleRowsCompare.find(prev_e => prev_e.num === e.num);
          if(prev_r != null) {
            rowObj = Object.assign({}, rowObj, prev_r);
          } else {
            this.topicCols.filter(col => col.disp).forEach((col, j) => {
              rowObj['values' + j] = '';
            });
          }
          for(let j = 0; j < e.values.length; j++) {
            rowObj['valuesB' + j] = e.values[j];
          }
          return rowObj;
        });
      }
      if(vRowArr.length > 0 && vRowArr.length < this.topicVisibleRowsCompare.length) {
        vRowArr = vRowArr.concat(this.topicVisibleRowsCompare.slice(vRowArr.length));
      }
      this.topicVisibleRowsCompare = vRowArr;
    }
  },
  created: function() {
    loadTopicContent(this);
  }
});

function loadTopicContent(vm) {
  axios.post('/backend-reduce.php', { topicId: vm.topicId })
    .then(function(response) {
      console.log(response.data);
      if(vm.validUser) {
        vm.following = response.data.following;
      }

      vm.topicName = response.data.name;
      const sheetUtil = sheetDefinitions[response.data.category];
      if(sheetUtil == null) {
        vm.$router.push('/error/4');
        return;
      }
      vm.topicCols = sheetUtil.columns.slice();
      vm.uniqueIndex = sheetUtil.uniqueIndex;

      const thDefaults = {
        text: '',
        value: '',
        align: 'left',
        sortable: false,
        class: '',
        width: 'auto'
      };
      const tableHeaders = [Object.assign({}, thDefaults, { value: 'num', width: 60 })];
      for(let j = 0; j < vm.topicCols.length; j++) {
        if(vm.topicCols[j].disp !== false) {
          const colObj = {
            text: vm.topicCols[j].disp,
            value: 'values' + j
          };
          tableHeaders.push(Object.assign({}, thDefaults, colObj));
        }
      }

      vm.topicHeadersCombine = tableHeaders.slice();
      for(let j = 0; j < vm.topicCols.length; j++) {
        if(vm.topicCols[j].disp !== false) {
          const colObj = {
            text: vm.topicCols[j].disp,
            value: 'valuesB' + j
          };
          if(j === 0) {
            colObj.border = 'left';
          }
          tableHeaders.push(Object.assign({}, thDefaults, colObj));
        }
      }
      vm.topicHeadersCompare = tableHeaders;

      if(Array.isArray(response.data.data)) {
        vm.topicRows = response.data.data;
        vm.topicContributors = {};
        for(let i = 0; i < vm.topicRows.length; i++) {
          if(empty(vm.topicContributors[vm.topicRows[i].username])) {
            vm.topicContributors[vm.topicRows[i].username] = 1;
          } else {
            vm.topicContributors[vm.topicRows[i].username]++;
          }
        }
        vm.setDialogSearchbarSelected();
        vm.getVisibleRows();
      }

      if(vm.requestUsername != null && vm.requestUsername !== '' &&
          vm.requestUsername in vm.topicContributors) {
        vm.selectVisibleCombine = 2;
        vm.selectUsersCombine = [vm.requestUsername];
        vm.$nextTick(() => {
          if(vm.$refs['dialog-searchbar'] != null) {
            vm.$refs['dialog-searchbar'].selectedItems = [{
              text: '@' + vm.requestUsername, value: vm.requestUsername
            }];
          }
        });
      }
    });
}
</script>
