if (parseInt(process.env.key) != 0) {
  lyaConfig = {
  SAVE_RESULTS: require("path").join(__dirname, "dynamic.json"),
  analysisCh: parseInt(process.env.key),
  removejson: ['hasOwnProperty'],
  };
  let lya = require("../../../../src/txfm.js");
  require = lya.configRequire(require, lyaConfig);
}
const time = process.hrtime();
const fs = require('fs');

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

const diff = process.hrtime(time);
const thisTime = (diff[0] * 1e9 + diff[1]) * 1e-6;
var logger = fs.createWriteStream('timetest.txt', {
  flags: 'a' // 'a' means appending (old data will be preserved)
})
logger.write('The time of ' + parseInt(process.env.key) + ' is ' + thisTime + ' \n', 'utf-8');
