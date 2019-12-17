lyaConfig = {
  SAVE_RESULTS: require("path").join(__dirname, "dynamic.json"),
  analysisCh: 1,
};
let lya = require("../../../src/txfm.js");
require = lya.configRequire(require, lyaConfig);

var moment = require('moment');
console.log(moment().format());
