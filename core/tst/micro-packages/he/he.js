let lya = require("/home/grigorisntousakis/lya/core/src/txfm.js");
let conf = {
  analysis: lya.preset.RWX_CHECKING,
  rules: require("path").join(__dirname, "static.json"),
  appendStats: "/home/grigorisntousakis/lya/core/tst/micro-packages/he/stats.txt",
  debug: true,
  context: {
    excludes: ['Promise', 'toString', 'escape', 'setImmediate'],
  },
  modules: {
    include: [require.resolve("./_he.js")]
  },
  printResults: true,
};
lya.configRequire(require, conf);
module.exports = require("./_he.js");
