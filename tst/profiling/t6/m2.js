console.log('m2: 1 second');
require('./m3.js');
var m4 = require('./m4.js');

module.exports = {
  loop: m4.loop,
}
