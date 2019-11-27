require("./variable_usage_control.js");

let m1 = require("./m1.js");
let m2 = require("./m2.js");

console.log(m1.fst === m2.fst, m1.fst, m2.fst)
