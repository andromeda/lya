// a simple math library
module.exports = {
  add: (a, b) => { console.log('test'); return a + b},  //If we remove the 'console' tag when calling  
                                          //the math.js in main it raises  exception not found
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
    