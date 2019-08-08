/* global window document Vue axios localStorage */
function sleep(ms) {
  return new Promise(resolve => window.setTimeout(resolve, ms));
}

function empty(v, type) {
  if(v === undefined || v === null) return true;
  if(type !== undefined) {
    if(type === 'array') {
      return (!Array.isArray(v) || v.length === 0);
    }
    if(typeof v !== type) return true;
    if(type === 'string') {
      return (v.length === 0);
    }
    if(type === 'object') {
      return (Object.keys(v).length === 0);
    }
    return false;
  }
  return false;
}

function randomizeWeighted(toRandomize, weights, resultLen) {
  if(empty(resultLen, 'number')) {
    resultLen = toRandomize.length;
  }
  if(!Array.isArray(toRandomize) || !Array.isArray(weights) ||
    toRandomize.length !== weights.length || resultLen < 0 || resultLen > toRandomize.length) {
      return [];
  }
  for(let i = 0; i < weights.length; i++) {
    if(empty(weights[i], 'number') || weights[i] <= 0) {
      return [];
    }
  }

  const resultRows = [];
  const resultIndices = [];
  let cdf = [];
  let scale = weights.reduce((acc, cur) => {
    cdf.push(acc + cur);
    return acc + cur;
  }, 0);
  let useRejection = true;
  while(resultRows.length < resultLen) {
    if(useRejection) {
      useRejection = (resultIndices.length / toRandomize.length) >= .98;
      if(!useRejection) {
        let weightsUsed = 0;
        cdf = cdf.map((e,i) => {
          if(resultIndices.indexOf(i) === -1) {
            return e - weightsUsed;
          }
          weightsUsed += weights[i];
          return -1;
        });
        scale -= weightsUsed;
      }
    }
    const rand = scale * Math.random();
    const pickIdx = cdf.findIndex(e => e > rand);
    if(!useRejection) {
      resultRows.push(toRandomize[pickIdx]);
      cdf = cdf.slice(0, pickIdx).concat(cdf.slice(pickIdx).map(e => e - weights[pickIdx]));
      cdf[pickIdx] = -1;
      scale -= weights[pickIdx];  // pdf[pickIdx]
    } else if(resultIndices.indexOf(pickIdx) === -1) {
      resultRows.push(toRandomize[pickIdx]);
      resultIndices.push(pickIdx);
    }
  }
  return resultRows;
}

function randomizeUnweighted(toRandomize, resultLen) {
  return randomizeWeighted(toRandomize, new Array(toRandomize.length).fill(1), resultLen);
}

function getRelativeTimeString(epoch) {
  const then = new Date(epoch * 1000);
  const now = new Date(Date.now());
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  if(then.getFullYear() === now.getFullYear()) {
    let hr = then.getHours();
    let min = then.getMinutes();
    let am = (hr < 12) ? 'AM' : 'PM';
    if(hr > 12) {
      hr -= 12;
    } else if(hr === 0) {
      hr = 12;
    }
    if(min < 10) {
      min = '0' + min;
    }
    let time = `${hr}:${min} ${am}`;
    if(then.getMonth() === now.getMonth() && then.getDate() === now.getDate()) {
      return time;
    } else {
      let mon = months[then.getMonth()];
      let day = then.getDate();
      return `${mon} ${day} ${time}`;
    }
  } else {
    let mon = months[then.getMonth()];
    let day = then.getDate();
    let year = then.getFullYear();
    return `${mon} ${day}, ${year}`;
  }
}

function getRelevance(s, q) {
  if(typeof s !== 'string' || typeof q !== 'string') {
    return NaN;
  }
  let qLower = q.toLowerCase();
  let sLower = s.toLowerCase();
  const qf = qLower.split(/\s+/g);
  qLower = qf[qf.length - 1];
  if(qLower[0] === '@') qLower = qLower.substring(1);
  const matchIdx = sLower.indexOf(qLower);
  if(matchIdx === -1) {
    return NaN;
  }
  return qLower.length - sLower.length - 9 * matchIdx;
}

var debounce = new (function() {
  this.counters = [];
  this.invoke = function(fn, _arguments, delay) {
    let fnIdx = this.counters.findIndex(e => (fn === e[0]));
    if(fnIdx === -1) {
      this.counters.push([fn, 0]);
      fnIdx = this.counters.length - 1;
    }
    const c = ++this.counters[fnIdx][1];
    sleep(delay).then(() => {
      if(c === this.counters[fnIdx][1]) fn.apply(null, _arguments);
    });
  };
})();

var throttle = new (function() {
  this.timers = [];
  this.invoke = function(fn, _arguments, delay) {
    let fnIdx = this.timers.findIndex(e => (fn === e[0]));
    const d = Date.now();
    if(fnIdx === -1) {
      this.timers.push([fn, d, 0]);
      fnIdx = this.timers.length - 1;
    }
    const last = this.timers[fnIdx][1];
    const c = ++this.timers[fnIdx][2];
    if(d > last + delay) {
      this.timers[fnIdx][1] = d;
      fn.apply(null, _arguments);
    } else {
      sleep(last + delay - d).then(() => {
        if(c === this.timers[fnIdx][2]) {
          this.timers[fnIdx][1] = Date.now();
          fn.apply(null, _arguments);
        }
      });
    }
  }
})();

function applyFormat(str, f) {
  if(empty(str, 'string') || empty(f, 'function')) {
    return str;
  }
  const re = new RegExp(/{([a-zA-Z_][a-zA-Z0-9_]*)}/g);
  let offset = 0;
  let retstr = str;
  let index = 0;
  while(true) {
    const match = re.exec(str);
    if(match == null) break;
    if(match.index > 0 && str[match.index - 1] === '\\' &&
            (match.index === 1 || str[match.index - 2] !== '\\')) {
      // Escaped
      continue;
    }
    let val = f(match[1], index);
    index++;
    if(val === undefined || val === null) {
      val = '';
    }
    if(typeof val !== 'string') {
      if(!empty(val.toString, 'function')) {
        val = val.toString();
      } else {
        val = '';
      }
    }
    const startRepl = match.index;
    const endRepl = match.index + match[0].length;
    retstr = retstr.substring(0, startRepl + offset) + val + retstr.substring(endRepl + offset);
    offset += val.length - (endRepl - startRepl);
  }
  retstr = retstr.replace(/\\{/g, '{');
  retstr = retstr.replace(/\\\\/g, '\\');
  return retstr;
}

function applyFormatFromObject(str, obj) {
  const f = (k => obj[k]);
  return applyFormat(str, f);
}

function signout() {
  sessionStorage.clear();
  localStorage.clear();
  axios.post('/backend-signout.php', { signout: true })
    .then(function(response) {
      if(response.data.signout === true) {
        window.location = '/index.php';
      } else {
        console.log('<p>Error signing you out</p>');
      }
    });
}

function doUserFollow(username, verb) {
  return new Promise(function(resolve, reject) {
    axios.post('/backend-follow.php', { action: verb, other_user: username })
      .then(function(response) {
        const modifiedRow = response.data.find(e => (e.user2 === username));
        resolve(modifiedRow);
      });
  });
}