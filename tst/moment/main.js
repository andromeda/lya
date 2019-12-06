require = require("../../src/txfm.js");
require.SAVE_RESULTS = require("path").join(__dirname, "dynamic.json");

var moment = require('../../node_modules/moment/moment.js');
console.log(moment().format());
