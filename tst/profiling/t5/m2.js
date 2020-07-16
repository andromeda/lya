let start = new Date();
for (var i = 0; i < 100000000; i++) {
  if ((new Date() - start) > 1000) {
    break;
  }
	let y=0;
};

console.log('m2: 1 second');
require('./m3.js');
var m4 = require('./m4.js');
m4.loop(2000);

module.exports = {
  loop: m4.loop,
}
