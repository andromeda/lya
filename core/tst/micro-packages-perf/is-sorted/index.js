let lya = require("/home/grigorisntousakis/lya/core/src/txfm.js");
let conf = {
  debugName: 'is-sorted:',
  analysis: lya.preset.CALL_NUMBERS,
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
