
let m = require('./math.js');

// let txfm = require('./txfm.js');
// m = txfm.wrap(m);


m.x = 3;
m.fft.mul(m.add(m.constants.pi, m.constants.e), m.x);
