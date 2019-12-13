lyaConfig = {
  SAVE_RESULTS: require("path").join(__dirname, "dynamic.json"),
  analysisCh: 4,
};

let lya = require("../../src/txfm.js");
require = lya.configRequire(require, lyaConfig);

let m1 = require('./m1.js');
global.test = 1;
global.test = 1;
// TODO: fix the problem with time
