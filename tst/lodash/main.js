require = require("../../src/txfm.js");
require.SAVE_RESULTS = require("path").join(__dirname, "dynamic.json");

var _ = require('../../node_modules/lodash/lodash.js');
var array = [1];
var other = _.concat(array, 2, [3], [[4]]);
 
console.log(other);