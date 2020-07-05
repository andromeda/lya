let lya = require("/home/grigorisntousakis/lya/core/src/txfm.js");
let conf = {
  debugName: 'is-generator:',
  analysis: lya.preset.CALL_NUMBERS,
  context: {
    excludes: ['Promise', 'toString', 'escape', 'setImmediate'],
  },
  modules: {
    include: [require.resolve("./_is-generator.js")]
  },
  printResults: true,
};
lya.configRequire(require, conf);
module.exports = require("./_is-generator.js");
