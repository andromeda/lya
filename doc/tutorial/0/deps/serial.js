const lg = require("./log.js");
lg.lvl = lg.levels.warn;

let block = (ms) => {
  let d = new Date();
  while((new Date() - d) < ms) {}
};

module.exports = {
 dec: (str) => {
  // block(5000)
  let obj;
  lg.info("srl:dec");
  // line 497 of Crockford's JSON parser
  obj = eval('(' + str + ')');
  // obj = JSON.parse(str);
  return obj
 },
 enc: (obj) => {}
}
