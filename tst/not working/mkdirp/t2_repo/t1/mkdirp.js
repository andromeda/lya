if (parseInt(process.env.npm_config_key) != 0) {
    lyaConfig = {
    SAVE_RESULTS: require("path").join(__dirname, "dynamic.json"),
    analysisCh: parseInt(process.env.npm_config_key),
    };
    let lya = require("../../../../../../src/txfm.js");
    require = lya.configRequire(require, lyaConfig);
}
const time = process.hrtime();

var assert = require('assert');
var mkdirp = require('mkdirp');
var path = require('path');
var fs = require('fs');


    for (var i = 0; i < 1; i++) {
        var x = Math.floor(Math.random() * Math.pow(16,4)).toString(16);
        var y = Math.floor(Math.random() * Math.pow(16,4)).toString(16);
        var z = Math.floor(Math.random() * Math.pow(16,4)).toString(16);
    
        var file = '/tmp/' + [x,y,z].join('/');
        var to = setTimeout(function () {
            assert.fail('never called back');
        }, 1000);
    
        mkdirp(file, 0755, function (err) {
            if (err) assert.fail(err);
            else path.exists(file, function (ex) {
                if (!ex) assert.fail('file not created')
                else fs.stat(file, function (err, stat) {
                    if (err) assert.fail(err)
                    else {
                        clearTimeout(to);
                        assert.eql(stat.mode & 0777, 0755);
                        assert.ok(stat.isDirectory(), 'target not a directory');
                    }
                })
            })
        });
    }


const diff = process.hrtime(time);
const thisTime = (diff[0] * 1e9 + diff[1]) * 1e-6;
var logger = fs.createWriteStream('timetest.txt', {
  flags: 'a' // 'a' means appending (old data will be preserved)
})
logger.write('The time of ' + parseInt(process.env.npm_config_key) + ' is ' + thisTime + ' \n', 'utf-8');

