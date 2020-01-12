lyaConfig = {
    SAVE_RESULTS: require("path").join(__dirname, "dynamic.json"),
    analysisCh: 6,
};
let lya = require("../../../../src/txfm.js");
require = lya.configRequire(require, lyaConfig);

let m1 = require("./m1.js");
console.log(m1);

let m2 = require("./m2.js");
console.log(m2);