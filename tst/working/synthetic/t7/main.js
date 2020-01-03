lyaConfig = {
    SAVE_RESULTS: require("path").join(__dirname, "dynamic.json"),
    analysisCh: 9,
};
let lya = require("../../../../src/txfm.js");
require = lya.configRequire(require, lyaConfig);

let m1 = require("./m1.js");
console.log(m1);

m1.add(1,3);
m1.fft.add(3,1);
