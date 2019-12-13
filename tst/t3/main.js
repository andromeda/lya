lyaConfig = {
  SAVE_RESULTS: require("path").join(__dirname, "dynamic.json"),
  analysisCh: 6,
};

let lya = require("../../src/txfm.js");
require = lya.configRequire(require, lyaConfig);

global.x = 3;
y = 4;

let m1 = require("./m1.js");
