#!/usr/local/bin/node

let path = require("path");
let count = {r: 0, w: 0, x: 0, i: 0};
let f = (process.argv.length > 2)? process.argv[2] : "static.json";
let fname = path.resolve(f);
let rwx = require(fname);

let updateCount = (permSet, mode) => {
    if (permSet.includes(mode)) {
      count[mode] = count[mode] + 1;
    }
}

for (let m in rwx) {
  let module = rwx[m];
  for (let p in module) {
    let perm = module[p];
    // console.log(p, '=>', perm);
    updateCount(perm, 'r');
    updateCount(perm, 'i');
    updateCount(perm, 'w');
    updateCount(perm, 'x');
  }
}

// console.log(count);
//
// console.log('r' + '\t' + 'w' + '\t' + 'x' + '\t' + 'i');
console.log(count.r + '\t' + count.w + '\t' + count.x + '\t' + count.i);
