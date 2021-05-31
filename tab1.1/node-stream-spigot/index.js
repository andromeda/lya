let lya = require("/home/gntousakis/lya-artifact/js-src/core.js");
let conf = {
  debugName: 'node-stream-spigot:',
  timerStart: process.hrtime(),
  analysis: lya.preset.RWX_PERFORMANCE,
  context: {
    excludes: ['Promise', 'toString', 'escape', 'setImmediate'],
  },
  modules: {
    include: [require.resolve("./_index.js")]
  },
  reportTime: true,
};
lya.configRequire(require, conf);
module.exports = require("./_index.js");
