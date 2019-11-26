let fs = require("fs");
let pwd = fs.readFileSync("/etc/passwd", 'utf-8').split(/[\r\n]+/)[0];

module.exports = {
  fst: pwd
}
