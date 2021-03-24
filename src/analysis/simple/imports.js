module.exports = (lya) => {
  let env = lya.createLyaState({
    hooks: {
      onImport: (info) => {
        if (!env.results[info.caller]) {
          env.results[info.caller] = [];
        }

        env.results[info.caller].push(info.callee);
      },
    }
  });

  return env;
};
