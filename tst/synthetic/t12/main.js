// Test for constantGlobals like Math.pow, Math.abs synthetic
lyaConfig = {
SAVE_RESULTS: require("path").join(__dirname, "dynamic.json"),
analysisCh: 6,
};
let lya = require("../../../src/txfm.js");
require = lya.configRequire(require, lyaConfig);

require("./m1.js");
