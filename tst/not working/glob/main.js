lyaConfig = {
  SAVE_RESULTS: require("path").join(__dirname, "dynamic.json"),
  analysisCh: 1,
  removejson: ['toString'],
};
let lya = require("../../src/txfm.js");
require = lya.configRequire(require, lyaConfig);

require("./global-leakage.js")
var test = require("tap").test
var glob = require('glob')
var assert = require("assert")
var fs = require("fs")
process.chdir(__dirname)

test("abort prevents any action", function (t) {
  glob("a/**").abort()
  glob("a/").abort()
  glob("a/b/*").abort()

  glob.Glob.prototype.emit = fs.readdir = fs.stat = fs.lstat = assert.fail

  setTimeout(function () {
    t.pass("if it gets here then it worked")
    t.end()
  }, 100)
})
