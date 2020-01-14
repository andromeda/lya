lyaConfig = {
SAVE_RESULTS: require("path").join(__dirname, "dynamic.json"),
analysisCh: 2,
};
let lya = require("../../src/txfm.js");
require = lya.configRequire(require, lyaConfig);

// Require all sunspider tests
require("./sunspider/access-nsieve.js")
