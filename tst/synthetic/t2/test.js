// run main and compare results with static
require('child_process').execSync("node ./main.js");
require("assert").deepStrictEqual(require("./dynamic.json"), require("./static.json"));
