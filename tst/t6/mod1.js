const mod3 = require("./mod3.js");
const mod4 = require("./mod4.js");

const run = function run() {
  for (let i = 0; i < 100000; i++) {
    if (Math.random() > 0.5) {
      mod3.run();
    } else {
      mod4.run();
    }
  }
};

module.exports = {run};
