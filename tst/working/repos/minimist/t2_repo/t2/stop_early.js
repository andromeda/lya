lyaConfig = {
  SAVE_RESULTS: require("path").join(__dirname, "dynamic.json"),
  analysisCh: 5,
  removejson: ['hasOwnProperty'],
};
let lya = require("../../../../../../src/txfm.js");
require = lya.configRequire(require, lyaConfig);

var parse = require('minimist');
var test = require('tape');

test('stops parsing on the first non-option when stopEarly is set', function (t) {
    var argv = parse(['--aaa', 'bbb', 'ccc', '--ddd'], {
        stopEarly: true
    });

    t.deepEqual(argv, {
        aaa: 'bbb',
        _: ['ccc', '--ddd']
    });

    t.end();
});
