<template>
  <v-container fluid>
    <v-layout d-flex align-center class="mt-3">
      <h1 class="font-weight-regular" style="font-size: 28px;">My Sheets</h1>
      <v-spacer></v-spacer>
      <v-btn flat color="primary" class="mb-1 flex-01" v-if="sheetsSelectedCount > 0" v-on:click="sheetDelete">
        Delete
        <v-icon v-if="fontsReady" class="ml-2">delete</v-icon>
      </v-btn>
      <v-menu transition="fade-transition" bottom left nudge-bottom="36px" class="flex-01">
        <v-btn class="btn-group-bg200" style="padding-right: 12px !important;" slot="activator">
          New
          <v-icon v-if="fontsReady">arrow_drop_down</v-icon>
        </v-btn>
        <ul class="navbar-dropdown">
          <nav-link right ref="navbar-links" v-for="(item, n) in newSheetLinks"
                  v-bind:linkdata="item" v-bind:key="n">
          </nav-link>
        </ul>
      </v-menu>
    </v-layout>
    <v-data-table v-if="sheetsDisplay"
            v-bind:headers="sheetsHeaders" v-bind:items="sheetsVisibleItems"
            :hide-actions="true" class="datatable">
      <template v-slot:items="props">
        <tr v-on:click="$router.push(props.item.href)">
          <td>
            <v-checkbox class="pa-0 ma-0" hide-details aria-label="Select"
                v-model="props.item.selected"
                v-on:click.stop="toggleSelected(props.item)">
            </v-checkbox>
          </td>
          <template v-for="(column, i) in sheetsHeaders">
          <td v-if="column.value !== 'selected'" v-text="props.item[column.value]" v-bind:key="i"
              v-bind:class="{'text-xs-right': (column.align === 'right')}"></td>
          </template>
        </tr>
      </template>
    </v-data-table>
    <p class="mt-1" v-if="lsReturned && !sheetsDisplay">You haven't saved any sheets yet.</p>

    <v-layout d-flex align-center class="mt-5 mb-2" v-if="validUser">
      <h1 class="flex-01 mr-2 font-weight-regular" style="font-size: 28px;">Relisten</h1>
      <v-btn flat v-if="fontsReady && relistenVisibleItems.length > 0" v-on:click="getVisibleRowsRelisten"
              aria-label="Refresh items" color="primary" class="flex-01 btn-dense px-2 mr-2" id="relisten-refresh">
        <v-icon class="icon-sm">
          refresh
        </v-icon>
      </v-btn>
      <v-spacer></v-spacer>
      <v-autocomplete ref="relisten-searchbar" v-model="selectUserRelisten" v-bind:items="relistenContributorsDialog"
              hide-no-data no-filter v-bind:search-input.sync="doRelistenContributorSearch"
              solo hide-details label="Select user" aria-label="Select user"
              v-bind:menu-props="{ 'contentClass': 'navbar-search-results' }" id="relisten-searchbar">
        <template v-slot:item="data">
          <v-list-tile-content v-text="data.item['text']"></v-list-tile-content>
        </template>
      </v-autocomplete>
      <template v-if="relistenId >= 0">
        <div class="flex-01" style="min-width: 12px;"></div>
        <v-btn class="btn-group-bg200 flex-01" v-on:click="$router.push('/sheet/' + relistenId)">
          Edit
        </v-btn>
      </template>
      <!-- <v-menu transition="fade-transition" bottom left nudge-bottom="36px" class="flex-01">
        <v-btn class="btn-group-bg200" style="padding-right: 12px !important;" slot="activator">
          New
          <v-icon v-if="fontsReady">arrow_drop_down</v-icon>
        </v-btn>
        <ul class="navbar-dropdown">
          <nav-link right ref="navbar-links" v-for="(item, n) in navLinks.sheets"
                  v-bind:linkdata="item" v-bind:key="n">
          </nav-link>
        </ul>
      </v-menu> -->
    </v-layout>
    <v-data-table v-if="validUser && relistenDisplay"
            v-bind:headers="relistenHeaders" v-bind:items="relistenVisibleItems"
            :hide-actions="true" class="datatable">
      <template v-slot:items="props">
        <td>
          <v-checkbox class="pa-0 ma-0" hide-details
              v-model="props.item.selected" v-on:change="relistenSelectedCount += (props.item.selected ? 1 : -1)">
          </v-checkbox>
        </td>
        <template v-for="col in relistenColumns">
          <td v-if="col.disp" v-text="props.item.values[col.n]" v-bind:key="col.n"></td>
        </template>
      </template>
    </v-data-table>
    <p class="mt-2" v-if="validUser && lsReturned && !relistenDisplay && relistenId < 0">
      This section gives you selections from a list of music you want to listen to.<br>
      You can include upcoming releases, songs you want to revisit, or anything you want.<br>
      You can make a list for <a href="#" onclick="relistenCreate(2)">just yourself</a>,
      or <a href="#" onclick="relistenCreate(1)">one to share with your followers</a>
    </p>
  </v-container>
</template>

<script>
function loadCategories(vm) {
  Object.keys(sheetDefinitions).forEach(id => {
    if(sheetDefinitions[id].title !== 'Relisten') {
      vm.newSheetLinks.push({ text: sheetDefinitions[id].title, href: `/sheet/new/${id}` });
    }
  });
}

function loadSheets(vm) {
  axios.post('/backend-ls.php', { what: 'sheets relisten' })
    .then((response) => {
      vm.lsReturned = false;
      vm.sheetsItems = [];
      vm.sheetsDisplay = false;
      vm.relistenItems = [];
      vm.relistenDisplay = false;
      vm.sheetsSelectedCount = 0;
      if(typeof response.data === 'object') {
        if(Array.isArray(response.data.sheets)) {
          let _sheetsItems = [];
          response.data.sheets.forEach(item => {
            const row = Object.assign({}, item, {
              date: getRelativeTimeString(item.mtime),
              href: `/sheet/${item.id}`,
              selected: false
            });
            if(item.submitted == null) {
              row.topic = '\u2014';
            } else {
              row.topic = item.submitted.name;
            }
            _sheetsItems.push(row);
          });
          vm.sheetsItems = _sheetsItems.sort((a, b) => b.mtime - a.mtime);
          vm.sheetsDisplay = (response.data.sheets.length > 0);
        }

        if(response.data.relisten != null) {
          const _relistenItems = response.data.relisten.data;
          _relistenItems.forEach(e => {
            e.values = vm.relistenUtil.validateRow(e.values);
          });
          vm.relistenItems = _relistenItems.filter(e => e.values !== false);
          vm.relistenDisplay = (vm.relistenItems.length > 0);
          if(response.data.relisten.submitted_sheet != null) {
            vm.relistenId = response.data.relisten.submitted_sheet;
          }
          response.data.relisten.data.forEach(e => {
            if(vm.relistenContributors[e.username] === undefined) {
              vm.relistenContributors[e.username] = 0;
            }
            vm.relistenContributors[e.username] += 1;
          });
          if(vm.userName in vm.relistenContributors) {
            vm.selectUserRelisten = vm.userName;
            vm.$nextTick(() => {
              if(vm.$refs['relisten-searchbar'] != null) {
                vm.$refs['relisten-searchbar'].selectedItems = [{ text: '@' + vm.userName, value: vm.userName }];
              }
            });
          }
        }

        vm.lsReturned = true;
      }
    });
}

var __dashboard = Vue.component('dashboard', {
  template: template``,
  name: 'dashboard',
  props: {
    validUser: Boolean,
    fontsReady: Boolean,
    userName: String
  },
  data: function() {
    return {
      newSheetLinks: [
        { href: '/import', text: 'Import' }
      ],
      sheetsHeaders: [
        {
          text: '',
          value: 'selected',
          align: 'left',
          sortable: false,
          class: '',
          width: '64px'
        },
        {
          text: 'Title',
          value: 'title',
          align: 'left',
          sortable: false,
          class: '',
          width: 'auto'
        },
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
      sheetsItems: [],
      sheetsDisplay: false,
      sheetsSelectedCount: 0,
      lsReturned: false,
      // ----- //
      doRelistenContributorSearch: null,
      selectUserRelisten: null,
      relistenId: -1,
      relistenContributors: {},
      relistenContributorsDialog: [],
      relistenUtil: sheetDefinitions[32769],
      relistenColumns: sheetDefinitions[32769].columns,
      relistenHeaders: [
        {
          text: '',
          value: 'selected',
          align: 'left',
          sortable: false,
          class: '',
          width: '64px'
        },
        {
          text: 'Music',
          value: 'music',
          align: 'left',
          sortable: false,
          class: '',
          width: 'auto'
        },
        {
          text: 'Comments',
          value: 'comments',
          align: 'left',
          sortable: false,
          class: '',
          width: 'auto'
        }
      ],
      relistenItems: [],
      relistenVisibleItems: [],
      relistenDisplay: false,
      relistenSelectedCount: 0,
    }
  },
  computed: {
    sheetsVisibleItems: function() {
      return this.sheetsItems.filter(e => (e.topic !== 'Relisten'));
    }
  },
  watch: {
    doRelistenContributorSearch: function(v) {
      this.relistenContributorsDialog = this.getRelistenContributorSearchResults(v);
    },
    selectUserRelisten: function(v) {
      this.getVisibleRowsRelisten();
    }
  },
  methods: {
    sheetDelete: function() {
      const toDelete = this.sheetsItems.filter(e => e.selected).map(e => e.id);
      axios.post('/backend-rm.php', { ids: toDelete })
        .then((response) => {
          if(response.data.delete === true) {
            this.sheetsItems = [];
            loadSheets(this);
          }
        });
    },
    getRelistenContributorSearchResults: function(q) {
      let userList = [];
      if(q === '') {
        userList = Object.keys(this.relistenContributors).slice(0, 5).map(e => ({ text: '@' + e, value: e }));
      } else {
        userList = Object.keys(this.relistenContributors).map(u => ({ text: '@' + u, value: u, relevance: getRelevance(u, q) }))
          .filter(r => !Number.isNaN(r.relevance));
        userList.sort((a, b) => (a.relevance > b.relevance ? -1 : 1));
        userList.splice(5);
        userList = userList.map(e => ({ text: e.text, value: e.value }));
      }
      return userList;
    },
    getVisibleRowsRelisten: function() {
      const userItems = this.relistenItems.filter(e => (e.username === this.selectUserRelisten));
      const availRows = userItems.map(row => {
        return Object.assign({}, row, { selected: false });
      });
      if(availRows.length <= 5) {
        this.relistenVisibleItems = availRows;
      } else {
        const weightCol = this.relistenColumns.findIndex(e => (e.field === 'weight'));
        const useRows = randomizeWeighted(availRows, availRows.map(e => e.values[weightCol]), 5);
        this.relistenVisibleItems = useRows;
      }
    },
    toggleSelected: function(item) {
      item.selected = !item.selected;
      this.sheetsSelectedCount += (item.selected ? 1 : -1);
    }
  },
  created: function() {
    this.$emit('update:title', 'Dashboard');
    loadCategories(this);
    loadSheets(this);
  }
});
</script>