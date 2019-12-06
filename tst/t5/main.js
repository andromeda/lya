global.analysisCh = 2;
require = require("../../src/txfm.js");
require.SAVE_RESULTS = require("path").join(__dirname, "dynamic.json");

let m1 = require('./m1.js');
global.test = 1;
global.test = 1;

