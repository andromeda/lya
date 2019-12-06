global.analysisCh = 1;
require = require("../../src/txfm.js");
require.SAVE_RESULTS = require("path").join(__dirname, "dynamic.json");

let m1 = require("./m1.js");
