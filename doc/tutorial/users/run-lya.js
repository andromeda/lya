const lya = require("../../../src/core.js");
const conf = {
  analysis: lya.preset.ON_OFF,
  print: true
};
lya.configRequire(require, conf);
require('./m1.js');
