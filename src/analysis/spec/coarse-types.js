module.exports = (lya) => {
  let env = lya.createLyaState({
    hooks: {
      onCallPre: (info) => {
        env.analysisResult[info.currentModule][info.nameToStore] = 'function';
      },
    },
  });

  return env;
};
