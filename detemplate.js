const fs = require('fs');
const path = require('path');
const util = require('util');

let instructions = {};
let scripts = {};
let outputs = [];
let resolvedParts = [];

const TEST = process.argv[2] === '--test';
if(TEST) {
  scripts = { a: '', b: '', c: '', d: '', e: '' }
  instructions = {
    a: { ref: 'c', prependTo: true },
    b: { ref: 'a', prependTo: false },
    c: { ref: 'e', prependTo: true },
    d: { ref: 'c', prependTo: false }
  }
  outputs = [
    { path: '', parts: ['e'] }
  ];
  resolvedParts = ['e'];
  Object.keys(instructions).forEach(resolveInstruction);
  console.log(util.inspect(outputs));
  process.exit(0);
}

const inDirectory = process.argv[2];
const outDirectory = process.argv[3];
if(!fs.statSync(inDirectory).isDirectory()) {
  console.error(`directory not found: ${inDirectory}`);
  process.exit(1);
}
if(!fs.statSync(outDirectory).isDirectory()) {
  console.error(`directory not found: ${outDirectory}`);
  process.exit(1);
}

const files = fs.readdirSync(inDirectory);
files.forEach(f => {
  const k = path.basename(f, '.vue');
  const o = path.join(outDirectory, k + '.js');

  let data = fs.readFileSync(path.join(inDirectory, f), { encoding: 'utf8' });
  const m = /<!--[ ]*(prependTo|appendTo):[ ]*([a-zA-Z_][0-9a-zA-Z_]+)[ ]*-->/.exec(data);
  if(m != null) {
    instructions[k] = {
      ref: m[2],
      prependTo: (m[1] === 'prependTo')
    };
  } else {
    // only output if no prepend or append instruction
    outputs.push({
      path: o,
      parts: [k]
    });
    resolvedParts.push(k);
  }

  const i1 = data.indexOf('<template>') + '<template>'.length;
  const i2 = data.lastIndexOf('</template>');
  const templateStr = '`' + data.substring(i1, i2).trim() + '`';
  const i3 = data.indexOf('<script>') + '<script>'.length;
  const i4 = data.lastIndexOf('</script>');
  if(i1 < 0 || i2 < 0 || i3 < 0 || i4 < 0) {
    console.error(`Mismatched tags in ${path.basename(f)}`);
    process.exit(1);
  }
  data = data.substring(i3, i4).trim().replace('template``', templateStr);
  scripts[k] = data;
});


function resolveInstruction(k) {
  const v = instructions[k];
  if(v == null || resolvedParts.includes(k)) {
    return;
  }
  if(typeof v.ref !== 'string') {
    console.error(`Instruction not understood: ${util.inspect(v)}`);
    return;
  }
  if(!(v.ref in scripts)) {
    console.error(`Component not found ${v.prependTo}`);
    return;
  }
  if(!(v.ref in resolvedParts)) {
    resolveInstruction(v.ref);
  }
  let placeFound = false;
  for(let index = 0; !placeFound && index < outputs.length; index++) {
    const refIdx = outputs[index].parts.indexOf(v.ref);
    if(refIdx >= 0) {
      placeFound = true;
      const insertIdx = refIdx + (v.prependTo ? 0 : 1);
      outputs[index].parts.splice(insertIdx, 0, k);
      resolvedParts.push(k);
    }
  }
  if(!placeFound) {
    console.error('Algorithm failed');
  }
}

Object.keys(instructions).forEach(resolveInstruction);

outputs.forEach(output => {
  const script = output.parts.map(k => scripts[k]).join('\n');
  fs.writeFileSync(output.path, script, { encoding: 'utf8' });
  console.log(`${output.path}: ${output.parts}`)
});
