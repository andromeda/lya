console.log(process.env.key)
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
test('whitespace should be whitespace' , function (t) {
	for (var ii = 0; ii < 100; ii++) {
		t.plan(1);
    	var x = parse([ '-x', '\t' ]).x;
    	t.equal(x, '\t');
	};
});


const diff = process.hrtime(time);
const thisTime = (diff[0] * 1e9 + diff[1]) * 1e-6;
var logger = fs.createWriteStream('timetest.txt', {
  flags: 'a' // 'a' means appending (old data will be preserved)
})
logger.write('The time of ' + parseInt(process.env.key) + ' is ' + thisTime + ' \n', 'utf-8');

