lyaConfig = {
  SAVE_RESULTS: require("path").join(__dirname, "dynamic.json"),
  analysisCh: 6,
  removejson: ['hasOwnProperty'],
};
let lya = require("../../../../src/txfm.js");
require = lya.configRequire(require, lyaConfig);

var parse = require('minimist');
var test = require('tape');

test('whitespace should be whitespace' , function (t) {
    t.plan(1);
    var x = parse([ '-x', '\t' ]).x;
    t.equal(x, '\t');
});
