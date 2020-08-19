let lg = require("./log.js");
lg.LVL = lg.levels.WARN;
module.exports = {
 dec: (str) => {
  let obj;
  lg.info("srl:dec");
  // line 497 of Crockford's JSON parser
  obj = eval('(' + str + ')');
  return obj
 },
 enc: (obj) => {}
}

