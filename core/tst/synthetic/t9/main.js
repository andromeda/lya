if (parseInt(process.env.key) != 0) {
        lyaConfig = {
        SAVE_RESULTS: require("path").join(__dirname, "dynamic.json"),
        analysisCh: parseInt(process.env.key),
        };
        let lya = require("../../../src/txfm.js");
        require = lya.configRequire(require, lyaConfig);
}

let m = require('./math.js');
m.x = 3;

//examples
console.log(m.fft.mul(m.add(m.constants.pi, m.constants.e), m.x));
console.log(m.fft.mul(m.add(m.constants.pi, m.constants.e), m.x));
console.log(m.fft.mul(m.add(m.constants.pi, m.constants.e), m.x));

console.log(m.fft.mul(m.add(m.constants.pi, m.fft.e), m.x));

m.sub(3,1);
m.constants.pi=15;
m.fft.mul=23;
m.fft.add(1, 3);
