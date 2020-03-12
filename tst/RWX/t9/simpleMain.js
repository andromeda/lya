lyaConfig = {
    SAVE_RESULTS: require("path").join(__dirname, "dynamic.json"),
    analysisCh: 12,
};
let lya = require("../../../src/txfm.js");
require = lya.configRequire(require, lyaConfig);
let m = require('./math.js');

m.x = 3;

//examples
console.log(m.fft.mul(m.add(m.constants.pi, m.constants.e), m.x));

console.log(m.sub(3,1));
m.constants.pi=15;
m.fft.mul=23;
