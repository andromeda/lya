let lya = require("/home/grigorisntousakis/lya/core/src/txfm.js");
let conf = {
  debugName: 'has-value:',
  analysis: lya.preset.RWX_CHECKING,
  rules: require("path").join(__dirname, "static.json"),
  appendStats: "/home/grigorisntousakis/lya/core/tst/micro-packages-perf/has-value/stats.txt",
  debug: true,
  context: {
    excludes: ['Promise', 'toString', 'escape', 'setImmediate'],
  },
  modules: {
    include: [require.resolve("./_index.js")]
  },
  printResults: true,
};
lya.configRequire(require, conf);
module.exports = require("./_index.js");
