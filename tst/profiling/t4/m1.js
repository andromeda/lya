let test = -11;
let test2 = test + 1;

test = Math.abs(test);
test = Math.abs(test);
test = Math.abs(test);

let testString = 'this is a test';
global.test = 3;

require('./m2.js');

let start = new Date();
for (var i = 0; i < 100000000; i++) {
  if ((new Date() - start) > 5000) {
    break;
  }
	let y=0;
};

console.log('m1: 5 second');
