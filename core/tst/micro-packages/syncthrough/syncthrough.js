let lya = require("/home/grigoriosntousakis/lya/core/src/txfm.js");
let conf = {
  analysis: lya.preset.RWX_CHECKING,
  rules: require("path").join(__dirname, "static.json"),
  appendStats: "/home/grigoriosntousakis/lya/core/tst/micro-packages/syncthrough/stats.txt",
  debug: true,
  context: {
    excludes: ['Promise', 'toString', 'escape', 'setImmediate'],
  },
  modules: {
    include: [require.resolve("./_syncthrough.js")]
  },
  printResults: true,
};
lya.configRequire(require, conf);
module.exports = require("./_syncthrough.js");
