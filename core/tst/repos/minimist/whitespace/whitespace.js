let lya = require("../../../../src/txfm.js");
let lyaConfig = {
  SAVE_RESULTS: require("path").join(__dirname, "dynamic.json"),
  analysis: lya.preset.RWX,
  removejson: ['undefined','hasOwnProperty'],
};
lya.configRequire(require, lyaConfig);

var parse = require('minimist');
var test = require('tape');
test('whitespace should be whitespace' , function (t) {
	for (var ii = 0; ii < 100; ii++) {
		t.plan(1);
    	var x = parse([ '-x', '\t' ]).x;
    	t.equal(x, '\t');
	};
});
