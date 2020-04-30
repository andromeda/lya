// Add this to your PATH:
// export LYA="/home/<username>/lya/core/src/txfm.js"
let lyaPath = process.env.LYA ?  process.env.LYA : "@andromda/lya"; 

let lya = require(lyaPath);
let conf = {
  analysis: require("path").join(__dirname, "..", "..", "src", "custom.js"),
  SAVE_RESULTS: require("path").join(__dirname, "dynamic.json"),
};

lya.configRequire(require, conf);

require("./main.js");
