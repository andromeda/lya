
// console.log("M1:", module.parent);

let fs = require("fs");
let pwd = fs.readFileSync("/etc/passwd", 'utf-8').split(/[\r\n]+/)[0];

let pOld = require("path").basename("/one/two/pizza.txt");
let p = require.resolve("./m2.js");

module.exports = {
  fst: pwd,
  snd: p
}
 
