lyaConfig = {};
lyaConfig.SAVE_RESULTS = require("path").join(__dirname, "dynamic.json");
// console.log(require);
let lya = require("../../src/txfm.js");
require = lya.configRequire(require, lyaConfig);

// var _ = require('../../node_modules/lodash/lodash.js');
var _ = require('lodash');
var array = [1];
var other = _.concat(array, 2, [3], [[4]]);
 
console.log(other);
