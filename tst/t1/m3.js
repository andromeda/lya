let fs = require("fs");
let pwd = fs.readFileSync("/etc/passwd", 'utf-8');

module.exports = {
  fst: pwd.split(/[\r\n]+/)[0]
}
