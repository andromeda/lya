
let f = require('./adder.js');
console.log(f(1))
console.log(f(2))
console.log(f(3))

// new f:
f = eval(f.toString())
console.log(f(1))
console.log(f(2))
console.log(f(3))

