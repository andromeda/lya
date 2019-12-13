lyaConfig = {
  SAVE_RESULTS: require("path").join(__dirname, "dynamic.json"),
  POLICY: require("path").join(__dirname, "dynamic.json"),
  analysisCh: 2,
};

let lya = require("../../src/txfm.js");
require = lya.configRequire(require, lyaConfig);

const m1 = require('./m1.js');
