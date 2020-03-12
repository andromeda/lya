lyaConfig = {
SAVE_RESULTS: require("path").join(__dirname, "dynamic.json"),
analysisCh: 6,
};
let lya = require("../../../src/txfm.js");
require = lya.configRequire(require, lyaConfig);

let globalTest = require('./m1.js');

y;
