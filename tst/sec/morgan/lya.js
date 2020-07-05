let lya = require("../../../src/txfm.js");
let conf = {
  analysis: lya.preset.RWX_CHECKING,
  rules: require("path").join(__dirname, "static.json"),
  context: {
    excludes: ['Buffer','toString', 'Error', 'process']
  },
  debug: true,
};
lya.configRequire(require, conf);
require("./poc.js");

