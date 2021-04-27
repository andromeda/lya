module.exports = (lya) => {
  let env = lya.createLyaState({
    hooks: {
      onImport: (info) => {
        if (!env.results[info.caller].deps) {
          env.results[info.caller].deps = [];
        }

        env.results[info.caller].deps.push(info.callee);
      },
      onExit: ({ saveIfAble, printIfAble }) => {
        saveIfAble();
        printIfAble();
      },
    }
  });

  return env;
};
