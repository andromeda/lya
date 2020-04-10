let lya = require("../../../src/txfm.js");
let lyaConfig = {
  SAVE_RESULTS: require("path").join(__dirname, "dynamic.json"),
  analysis: lya.preset.RWX,
  inputString: false,
};
require = lya.configRequire(require, lyaConfig);
require('./m1.js');
