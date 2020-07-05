let lya = require("/home/grigorisntousakis/lya/core/src/txfm.js");
let conf = {
  SAVE_RESULTS: require("path").join(__dirname, "dynamic.json"),
  analysis: lya.preset.RWX,
  modules: {
    include: [require.resolve("./_index.js")]
  },
};
lya.configRequire(require, conf);
module.exports = require("./_index.js");

