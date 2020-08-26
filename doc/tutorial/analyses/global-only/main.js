const lya = require('../../../../../src/core.js');
const conf = {
  SAVE_RESULTS: require('path').join(__dirname, 'dynamic.json'),
  analysis: lya.preset.GLOBAL_ONLY,
};
lya.configRequire(require, conf);
require('./add.js');
