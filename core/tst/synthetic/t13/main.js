let lya = require("../../../src/txfm.js");
console.log(lya)
let lyaConfig = {
  SAVE_RESULTS: require("path").join(__dirname, "dynamic.json"),
  analysis: lya.preset.RWX,
};
require = lya.configRequire(require, lyaConfig);

require('./m1.js')
