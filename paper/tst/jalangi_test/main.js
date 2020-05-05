let lya = require("../../../core/src/txfm.js");
let conf = {
  SAVE_RESULTS: require("path").join(__dirname, "dynamic.json"),
  analysis: lya.preset.RWX,
};
lya.configRequire(require, conf);

// Require all sunspider tests
require("./sunspider/replaceme.js")
