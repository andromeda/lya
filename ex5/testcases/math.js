let fs = require("fs");
let d = new Date();
let a = new Array();

/**
 * Δεν βλέπει τa (i) require, (ii) fs, και (iii) readFileSync
 * Επίσης, τι είναι το realpathSync?
 *
 * { 'math.js':
 *    { Date: 1,
 *      Array: 1,
 *      '': 12,
 *      realpathSync: 2,
 *      add: 4,
 *      mul: 1,
 *      sub: 1 },
 */
let x = fs.readFileSync('/etc/passwd');



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

