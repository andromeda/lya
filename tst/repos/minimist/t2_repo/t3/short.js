if (parseInt(process.env.key) != 0) {
  lyaConfig = {
  SAVE_RESULTS: require("path").join(__dirname, "dynamic.json"),
  analysisCh: parseInt(process.env.key),
  removejson: ['hasOwnProperty'],
  };
  let lya = require("../../../../../../src/txfm.js");
  require = lya.configRequire(require, lyaConfig);
}
const time = process.hrtime();
const fs = require('fs');

var parse = require('minimist');
var test = require('tape');

test('numeric short args', function (t) {
    t.plan(2);
    t.deepEqual(parse([ '-n123' ]), { n: 123, _: [] });
    t.deepEqual(
        parse([ '-123', '456' ]),
        { 1: true, 2: true, 3: 456, _: [] }
    );
});

test('short', function (t) {
    t.deepEqual(
        parse([ '-b' ]),
        { b : true, _ : [] },
        'short boolean'
    );
    t.deepEqual(
        parse([ 'foo', 'bar', 'baz' ]),
        { _ : [ 'foo', 'bar', 'baz' ] },
        'bare'
    );
    t.deepEqual(
        parse([ '-cats' ]),
        { c : true, a : true, t : true, s : true, _ : [] },
        'group'
    );
    t.deepEqual(
        parse([ '-cats', 'meow' ]),
        { c : true, a : true, t : true, s : 'meow', _ : [] },
        'short group next'
    );
    t.deepEqual(
        parse([ '-h', 'localhost' ]),
        { h : 'localhost', _ : [] },
        'short capture'
    );
    t.deepEqual(
        parse([ '-h', 'localhost', '-p', '555' ]),
        { h : 'localhost', p : 555, _ : [] },
        'short captures'
    );
    t.end();
});
 
test('mixed short bool and capture', function (t) {
    t.same(
        parse([ '-h', 'localhost', '-fp', '555', 'script.js' ]),
        {
            f : true, p : 555, h : 'localhost',
            _ : [ 'script.js' ]
        }
    );
    t.end();
});
 
test('short and long', function (t) {
    t.deepEqual(
        parse([ '-h', 'localhost', '-fp', '555', 'script.js' ]),
        {
            f : true, p : 555, h : 'localhost',
            _ : [ 'script.js' ]
        }
    );
    t.end();
});

const diff = process.hrtime(time);
const thisTime = (diff[0] * 1e9 + diff[1]) * 1e-6;
var logger = fs.createWriteStream('timetest.txt', {
  flags: 'a' // 'a' means appending (old data will be preserved)
})
logger.write('The time of ' + parseInt(process.env.key) + ' is ' + thisTime + ' \n', 'utf-8');

