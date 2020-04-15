let lya = require("../../../../../src/txfm.js");
let lyaConfig = {
  SAVE_RESULTS: require("path").join(__dirname, "dynamic.json"),
  analysis: lya.preset.RWX,
};
require = lya.configRequire(require, lyaConfig);

var last = require('array-last');

last(['a', 'b', 'c', 'd', 'e', 'f']);
//=> 'f'

last(['a', 'b', 'c', 'd', 'e', 'f'], 1);
//=> 'f'

last(['a', 'b', 'c', 'd', 'e', 'f'], 3);
//=> ['d', 'e', 'f']
