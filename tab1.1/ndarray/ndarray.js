let lya = require("/home/gntousakis/lya-artifact/js-src/core.js");
let conf = {
  debugName: 'ndarray:',
  timerStart: process.hrtime(),
  analysis: lya.preset.RWX_PERFORMANCE,
  context: {
    excludes: ['Promise', 'toString', 'escape', 'setImmediate'],
  },
  modules: {
    include: [require.resolve("./_ndarray.js")]
  },
  reportTime: true,
};
lya.configRequire(require, conf);
module.exports = require("./_ndarray.js");
