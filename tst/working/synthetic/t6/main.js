lyaConfig = {
    SAVE_RESULTS: require("path").join(__dirname, "dynamic.json"),
    analysisCh: 9,
};
let lya = require("../../../../src/txfm.js");
require = lya.configRequire(require, lyaConfig);


let x = require("./m1.js");
console.log(x);
let y = x + 1;
