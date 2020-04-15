let lya = require("../../../../../src/txfm.js");
let lyaConfig = {
  SAVE_RESULTS: require("path").join(__dirname, "dynamic.json"),
  analysis: lya.preset.RWX,
};
require = lya.configRequire(require, lyaConfig);

var range = require('array-range')
range(3)       // -> [ 0, 1, 2 ]
range(1, 4)    // -> [ 1, 2, 3 ]

var array = require('array-range')
array(5).map( x => x*x )
// -> [ 0, 1, 4, 9, 16 ]

array(2, 10).filter( x => x%2===0 )
// -> [ 2, 4, 6, 8 ]
