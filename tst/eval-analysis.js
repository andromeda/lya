module.exports = (lya) => {
  let env = lya.createLyaState({
    hooks: {
      onCallPre: ({ currentModule, target, argumentsList, nameToStore }) => {
        const storedCalls = env.results[currentModule] = env.results[currentModule] || {};
        storedCalls[nameToStore] = (storedCalls[nameToStore] || 0) + 1;
      },
      onExit: (env, { printIfAble }) => {
        printIfAble();
      },
    },
  });

  return env;
};
