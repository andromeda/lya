let lya = require("../../../../../src/txfm.js");
let lyaConfig = {
  SAVE_RESULTS: require("path").join(__dirname, "dynamic.json"),
  analysis: lya.preset.RWX,
  modules: { 
    include: ['/home/grigorisntousakis/lya/core/node_modules/array-first/index.js']
  }
};
require = lya.configRequire(require, lyaConfig);

var first = require('array-first');

first(['a', 'b', 'c', 'd', 'e', 'f']);
//=> 'a'

first(['a', 'b', 'c', 'd', 'e', 'f'], 1);
//=> 'a'

first(['a', 'b', 'c', 'd', 'e', 'f'], 3);
//=> ['a', 'b', 'c']
