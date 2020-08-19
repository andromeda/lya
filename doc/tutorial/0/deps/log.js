let lib = {};

// by default, output everything
lib.lvl = 1;

lib.levels = {
  ERR: 3,
  WARN: 2,
  INFO: 1, 
};

lib.info = (...s) => {
  if (lib.lvl <= lib.levels.INFO) {
    console.log(...s)
  }
};

lib.warn = (...s) => {
  if (lib.lvl <= lib.levels.WARN) {
    console.log(...s)
  }
};

lib.err = (...s) => {
  if (lib.lvl <= lib.levels.ERR) {
    console.log(...s)
  }
};

module.exports = lib;
