let lya = require("/home/gntousakis/lya-artifact/js-src/core.js");
let conf = {
  debugName: 'node-slug:',
  timerStart: process.hrtime(),
  analysis: lya.preset.RWX_PERFORMANCE,
  context: {
    excludes: ['Promise', 'toString', 'escape', 'setImmediate'],
  },
  modules: {
    include: [require.resolve("./_slug.js")]
  },
  reportTime: true,
};
lya.configRequire(require, conf);
module.exports = require("./_slug.js");
