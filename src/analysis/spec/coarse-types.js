const fs = require('fs');

module.exports = (lya) => {
  const env = lya.createLyaState();

  Object.assign(env.config.hooks, {
    onCallPre: (info) => {
      env.analysisResult[info.currentModule][info.nameToStore] = 'function';
    },
  });

  return env;
};
