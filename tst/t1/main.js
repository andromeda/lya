global.analysisCh = 1;
require = require("../../src/txfm.js");

require.SAVE_RESULTS = require("path").join(__dirname, "dynamic.json");

const m1 = require('./m1.js');
const o = new Number();
// Do we want to print it on results? (Number from main)
