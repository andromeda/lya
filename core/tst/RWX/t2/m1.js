
// console.log("M1:", module.parent);

// TODO: Because we wrap openSync in a proxy now everytime we call
// readFileSync because it call openSync we see it in the dynamic json
let os = require("fs").openSync;
let pwd = require("fs").readFileSync("/etc/passwd", 'utf-8').split(/[\r\n]+/)[0];


// Require path breaks it // TODO:fix it
//let check =  require("path")
//let pOld = require("path").basename("/one/two/pizza.txt");


let p = require("./m2.js");

module.exports = {
  fst: pwd,
  snd: p
}
