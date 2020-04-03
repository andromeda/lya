let lya = require("../../../src/txfm.js");
let lyaConfig = {
  SAVE_RESULTS: require("path").join(__dirname, "dynamic.json"),
  analysis: lya.preset.RWX,
  removejson: ['undefined','hasOwnProperty'],
};
require = lya.configRequire(require, lyaConfig);

var argv = require('minimist')(process.argv.slice(2));
console.log(argv);
