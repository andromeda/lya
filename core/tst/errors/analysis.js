// Add this to your PATH:
// export LYA="/home/<username>/lya/core/src/txfm.js"
let lyaPath = process.env.LYA ?  process.env.LYA : "../../src/txfm.js"; 

let lya = require(lyaPath);
let conf = {
  analysis: lya.preset.RWX, // require("path").join(__dirname, "..", "..", "src", "custom.js"),
  SAVE_RESULTS: require("path").join(__dirname, "dynamic.json"),
  context: {
    excludes: ['Buffer'],
  },
};

lya.configRequire(require, conf);

require("./main1.js");
