global.analysisCh = 1;
require = require("../../src/txfm.js");
require.SAVE_RESULTS = require("path").join(__dirname, "dynamic.json");

global.x = 3;
y = 4;

let m1 = require("./m1.js");
