let lya = require("/home/grigorisntousakis/lya/core/src/txfm.js");
let conf = {
  debugName: 'he:',
  analysis: lya.preset.CALL_NUMBERS,
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
