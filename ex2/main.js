let m = require('./math.js');
let txfm = require('./txfm.js');

m = txfm(m);

m.x = 3;

//examples
console.log(m.fft.mul(m.add(m.constants.pi, m.constants.e), m.x));
console.log(m.fft.mul(m.add(m.constants.pi, m.constants.e), m.x));
console.log(m.fft.mul(m.add(m.constants.pi, m.constants.e), m.x));

console.log(m.fft.mul(m.add(m.constants.pi, m.fft.e), m.x));

m.constants.pi=15;
m.fft.mul=23;