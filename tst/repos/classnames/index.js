let lya = require("/home/grigorisntousakis/lya/core/src/txfm.js");
let conf = {
  analysis: lya.preset.RWX,
  SAVE_RESULTS: require("path").join(__dirname, "dynamic.json"), 
  context: {
    excludes: [],
  },
  modules: {
    include: [require.resolve("./_index.js")]
  },
  printResults: true,
};
lya.configRequire(require, conf);
module.exports = require("./_index.js");

