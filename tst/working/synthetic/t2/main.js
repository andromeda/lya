lyaConfig = {
  SAVE_RESULTS: require("path").join(__dirname, "dynamic.json"),
  analysisCh: 2,
};

let lya = require("../../../../src/txfm.js");
require = lya.configRequire(require, lyaConfig);

// Un-commenting  the line below will fail the test
//let pwd = require('fs').readFileSync('/etc/passwd');

let m1 = require("./m1.js");
let m2 = require("./m2.js");

if (m1.fst === [m2.fst, m1.fst, m2.fst]) {
  x = 3;
}
