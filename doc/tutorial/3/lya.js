const lya = require('../../../../src/txfm.js');
const conf = {
  SAVE_RESULTS: require('path').join(__dirname, 'dynamic.json'),
  analysis: lya.preset.RWX,
};
lya.configRequire(require, conf);
require('./main.js');
