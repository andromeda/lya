module.exports = (lya) => {
  let env = lya.createLyaState({
    hooks: {
      onCallPre: (info) => {
        env.results[info.currentModule][info.nameToStore] = 'function';
      },
    },
  });

  return env;
};
