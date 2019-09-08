function solrEscape(text, parser) {
  const map = {
    '+': '\\+',
    '-': '\\-',
    '&': '\\&',
    '|': '\\|',
    '!': '\\!',
    '(': '\\(',
    ')': '\\)',
    '{': '\\{',
    '}': '\\}',
    '[': '\\[',
    ']': '\\]',
    '^': '\\^',
    '"': '\\"',
    '~': '\\~',
    '*': '\\*',
    '?': '\\?',
    ':': '\\:',
    '/': '\\/',
    '\\': '\\\\'
  };
  const complexphraseMap = {
    '+': '\\+',
    '-': '\\-',
    '&': '\\&',
    '|': '\\|',
    '!': '\\!',
    '(': '\\(',
    ')': '\\)',
    '{': '\\{',
    '}': '\\}',
    '[': '\\[',
    ']': '\\]',
    '^': '\\^',
    '"': '\\"',
    '~': '\\~',
    '*': '\\*',
    '?': '\\?',
    ':': '\\:',
    '/': '\\/',
    '\\': '\\\\'
  }

  if(parser === 'complexphrase') {
    return text.replace(/[+&|!(){}\[\]^"~*?:/\\-]/g, function(m) { return complexphraseMap[m]; })  //.replace(/\\/g, '\\\\');
  } else {
    return text.replace(/[+&|!(){}\[\]^"~*?:/\\-]/g, function(m) { return map[m]; });
  }
}

function solrGetIdState(id) {
  if(typeof id !== 'string') {
    return -1;  // invalid
  }
  if(id.length === 0) {
    return 0;  // uninitialized
  }
  if(id.startsWith('!')) {
    return 1;  // fallback
  }
  if(/^[0-9]+$/.test(id)) {
    return 2;  // final
  }
  return -1;
}

var sheetDefinitions = {};

sheetDefinitions[0] = {
  title: "Artist/Album",
  columns: [
    {
      n: 0,
      disp: "Artist",
      field: "artist_credit",
      input: true
    },
    {
      n: 1,
      disp: "Album",
      field: "name",
      input: true
    },
    {
      n: 2,
      disp: false,
      field: "id",
      input: false
    }
  ],
  uniqueIndex: 2,
  emptyRowValues: function() {
    return ['', '', ''];
  },
  getRowState: function(arr) {
    return solrGetIdState(arr[2]);
  },
  resetRowState: function(arr) {
    arr[2] = '';
  },
  validateRow: function(arr) {
    if(!Array.isArray(arr) || typeof arr[0] !== 'string' || typeof arr[1] !== 'string') {
      return false;
    }
    if(arr[0] === '' && arr[1] === '') {
      return false;
    }
    if(solrGetIdState(arr[2]) < 2) {
      arr[2] = applyFormat('!{artist_credit} - {name}', (field, i) => arr[i]);
    }
    return arr;
  },
  makeQuery: function(arr) {
    const retval = {
      type: 'solr',
      db: 'release_group',
      params: {
        defType: 'edismax'
      }
    };

    let qa = []
    if(arr[0] !== '') {
      const words = arr[0].split(/\s+/).map((w, i, arr) => {
        if(i < arr.length - 1) {
          return `artist_credit:${solrEscape(w)}`; 
        }
        return `artist_credit:${solrEscape(w)}*`;
      });

      qa.push(words.join(' '));
    }
    if(arr[1] !== '') {
      const words = arr[1].split(/\s+/).map((w, i, arr) => {
        if(i < arr.length - 1) {
          return `name:${solrEscape(w)}`; 
        }
        return `name:${solrEscape(w)}*`;
      });

      qa.push(words.join(' '));
    }
    retval.params.q = qa[0];
    if(qa.length > 1) {
      retval.params.bq = qa[1];
    }
    return retval;
  },
  objToString: function(obj) {
    return applyFormatFromObject("{artist_credit}  \u2014  {name}", obj);
  }
};

sheetDefinitions[1] = Object.assign({}, sheetDefinitions[0], {
  title: "Artist/Song",
  makeQuery: function(arr) {
    const retval = {
      type: 'solr',
      db: 'recording',
      params: {}
    };

    if(arr[1] === '') {
      retval.params.q = 'artist_credit:' + arr[0];
    } else {
      retval.params.q = 'name:' + arr[1];
      if(arr[0] !== '') {
        retval.params.bq = 'artist_credit:' + arr[0];
      }
    }
    return retval;
  }
});
sheetDefinitions[1].columns[1].name = 'Song';

sheetDefinitions[32768] = {
  title: "Todo",
  columns: [
    {
      n: 0,
      disp: "Task",
      field: "task",
      input: true
    },
    {
      n: 1,
      disp: "Comments",
      field: "comments",
      input: true
    }
  ],
  uniqueIndex: -1,
  emptyRowValues: function() {
    return ['', ''];
  },
  getRowState: function(arr) {
    return 0;
  },
  resetRowState: function(arr) {
    return;
  },
  validateRow: function(arr) {
    return arr;
  },
  objToString: function(obj) {
    return applyFormatFromObject("{task}, {comments}", obj);
  }
};

sheetDefinitions[32769] = {
  title: "Relisten",
  columns: [
    {
      n: 0,
      disp: "Music",
      field: "music",
      input: true,
    },
    {
      n: 1,
      disp: "Comments",
      field: "comments",
      input: true,
    },
    {
      n: 2,
      disp: false,
      field: "weight",
      input: false,
    },
    {
      n: 3,
      disp: false,
      field: "count",
      input: false,
    }
  ],
  uniqueIndex: -1,
  emptyRowValues: function() {
    return ['', '', 1, 0];
  },
  getRowState: function() {
    return 0;
  },
  resetRowState: function() {
    if(typeof arr[2] === 'number') {
      arr[2] = 1;
    }
    if(typeof arr[3] === 'number') {
      arr[3] = 0;
    }
  },
  validateRow: function(arr) {
    if(!Array.isArray(arr) || typeof arr[0] !== 'string' || typeof arr[1] !== 'string') {
      return false;
    }
    if(arr[0] === '' && arr[1] === '') {
      return false;
    }
    if(typeof arr[2] !== 'number') {
      const dec = parseInt(arr[2], 10);
      arr[2] = (Number.isFinite(dec) ? dec : 1);
    }
    if(typeof arr[3] !== 'number') {
      const dec = parseInt(arr[3], 10);
      arr[3] = (Number.isFinite(dec) ? dec : 0);
    }
    return arr;
  },
  objToString: function(obj) {
    return applyFormatFromObject("{task}, {comments}", obj);
  }
};