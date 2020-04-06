let lya = require("../../../../src/txfm.js");
let lyaConfig = {
  SAVE_RESULTS: require("path").join(__dirname, "dynamic.json"),
  analysis: lya.preset.RWX,
  removejson: ['undefined','hasOwnProperty'],
};
lya.configRequire(require, lyaConfig);

var parse = require('minimist');
var test = require('tape');

test('stops parsing on the first non-option when stopEarly is set', function (t) {
  for (var i = 0; i < 10; i++) {
    var argv = parse(['--aaa', 'bbb', 'ccc', '--ddd'], {
        stopEarly: true
    });

    t.deepEqual(argv, {
        aaa: 'bbb',
        _: ['ccc', '--ddd']
    });

  }
  t.end();
});
