global.analysisCh = 2;
require = require("../../src/txfm.js");
// Un-commenting  the line below will fail the test
//let pwd = require('fs').readFileSync('/etc/passwd');
require.SAVE_RESULTS = require("path").join(__dirname, "dynamic.json");

let m1 = require("./m1.js");
let m2 = require("./m2.js");

if (m1.fst === [m2.fst, m1.fst, m2.fst]) {
  x = 3;
}
