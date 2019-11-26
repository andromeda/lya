
let fs = require("fs");
let pwd = fs.readFileSync("/etc/passwd", 'utf-8').split(/[\r\n]+/)[0];

let p = require("path").resolve("./m2.js");

module.exports = {
  fst: pwd,
  snd: p
}
 
