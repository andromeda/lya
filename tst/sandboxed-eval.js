// caller should use require("@andromeda/lya") to sandbox

//let log = require("log");
exports = {
  dec: (str) => {
    //log.info("[start]");
    return eval(str);
  },
}

