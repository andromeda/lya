let lya = require("../../../src/txfm.js");
let conf = {
  analysis: lya.preset.RWX_CHECKING,
  rules: require("path").join(__dirname, "static.json"),
  context: {
    excludes: ['Array']
  },
  debug: true,
};
lya.configRequire(require, conf);
require("./poc.js");

