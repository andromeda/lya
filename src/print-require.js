const onImport = (caller, callee, name) => {
  console.log('lya:', caller, 'imports', callee, name);
};

module.exports = (e) => {
  return {
    onImport: onImport,
  };
};
