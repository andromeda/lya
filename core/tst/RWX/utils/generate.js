#!env node

// Create a test per (every property in default-names) x {R, W, X, RW, RX, WX, RWX}

let names = Object.values(require("../../../src/default-names.json"))
  .map( e => Object.values(e) )
  .reduce((acc, val) => acc.concat(val), [])
  .reduce((acc, val) => acc.concat(val), []); 
let fs = require("fs");

let prop = (n, k) => n + '.' + k;
let read = (n, k)  => '_ = ' + prop(n, k) + ';\n';
let write = (n, k) => prop(n, k) + ' = {};\n';
let exec = (n, k)  => prop(n, k) + '();\n';

let getAccess = (obj, name) => {
  r = 'var _;\n';
  w = '';
  x = '';

  if (typeof obj === 'function') {
    x += (name + '();\n');
  }

  for (let k of Object.getOwnPropertyNames(obj)) {
    r += read(name, k );
    w += write(name, k);
    if (typeof obj[k] === 'function') {
      x += exec(name, k);
    }
  }
  let a = {r: r, w: w, x: x, rw: r + w, rx: r + x, wx: w + x, rwx: r + w + x};
  // console.log(a);
  return a;
}

fid = 30; // starting identifier
let newFileId = () => 't' + (fid++);

let getImport = () => 'require("./m1.js");\n';

let writeFile = (id, data) => {
  fs.mkdirSync(id)
  fs.writeFileSync("./" + id + "/main.js", getImport(), "utf-8")
  fs.writeFileSync("./" + id + "/m1.js", data, "utf-8")
}

let generateTests = (n) => {
  // console.log('----\n', n)
  let access = getAccess(global[n], n); 
  for (let a in access) {
    writeFile(newFileId(), access[a]);
  }
  //writeFile(newFileId(), access[a]);
}

for (let n of names) {
  if (global[n]) {
    //console.log(n);
    // generateTests(n);
  } else {
    console.log(n);
  }
}


// generateTests("Reflect");
