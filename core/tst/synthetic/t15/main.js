let lya = require("../../../src/txfm.js");
let lyaConfig = {
  SAVE_RESULTS: require("path").join(__dirname, "dynamic.json"),
  analysis: lya.preset.RWX,
};
require = lya.configRequire(require, lyaConfig);
let m1 = require("./m1.js");
let m2 = require("./m2.js");

if (m1.fst === [m2.fst, m1.fst, m2.fst]) {
  x = 3;
}
