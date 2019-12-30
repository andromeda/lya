lyaConfig = {
SAVE_RESULTS: require("path").join(__dirname, "dynamic.json"),
analysisCh: 8,
};
let lya = require("../../src/txfm.js");
require = lya.configRequire(require, lyaConfig);

require("./3d-raytrace.js");
