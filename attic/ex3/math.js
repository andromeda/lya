let fs = require('fs');
let net = require('net');

// a simple math library
module.exports = {
  add: (a, b) => a + b,
  sub: (a, b) => a - b,
  constants: {
    pi: 3.14,
    e: 2.71
  },
  fft: {
    add: (a, b) => a + b,
    mul: (a, b) => a * b,
  }
}
    
