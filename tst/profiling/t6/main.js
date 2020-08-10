// Testing correct overhead attribution from Lya's performance analysis.
// (Massive performance overhead by 'with')

var m1 = require('./m1.js');
var m2 = require('./m2.js');

global.test = 1;
global.test = 1;

m2.loop(3000);
