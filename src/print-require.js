let env;

// TODO:
// add callee path
const onRequire = (caller, callee) => {
  console.log('lya:', caller, 'imports', callee);
};

module.exports = (e) => {
  env = e;
  return {
    onRequire: onRequire,
  };
};
