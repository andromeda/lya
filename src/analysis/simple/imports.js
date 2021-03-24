module.exports = (lya) => {
  const env = lya.createLyaState();

  Object.assign(env.config.hooks, {
    onImport: (info) => {
      if (!env.results[info.caller]) {
        env.results[info.caller] = [];
      }
      
      env.results[info.caller].push(info.callee);
    },
  });

  return env;
};
