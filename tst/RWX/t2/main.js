const fs = require('fs');

// Un-commenting  the line below will fail the test
//let pwd = require('fs').readFileSync('/etc/passwd');

let m1 = require("./m1.js");
console.log('haha')
let m2 = require("./m2.js");

if (m1.fst === [m2.fst, m1.fst, m2.fst]) {
  x = 3;
}
