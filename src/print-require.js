const onRequire = (caller, callee) => {
  console.log('lya:', caller, 'imports', callee);
};

module.exports = (e) => {
  return {
    onRequire: onRequire,
  };
};
