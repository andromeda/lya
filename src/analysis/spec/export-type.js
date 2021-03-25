module.exports = (lya) => {
  let env;
  const types = [];

  const updateAnalysisData = (storedCalls, truename, types) => {
    if (Object.prototype.hasOwnProperty.
        call(storedCalls, truename) === false) {
      storedCalls[truename] = {core: types};
    }
  };

  // onCallPre <~ is called before the execution of a function
  const onCallPre = (info) => {
    const inputType = [];
    if (!info.argumentsList.length) {
      inputType.push('no-input');
    } else {
      for (let i = 0; i < info.argumentsList.length; i++) {
        inputType.push(typeof info.argumentsList[i]);
      }
    }
    types[info.nameToStore] = inputType;
  };

  // onCallPost <~ Is call after every execution of a function
  const onCallPost = (info) => {
    types[info.nameToStore].push(info.result ? typeof info.result : 'no output');
    updateAnalysisData(env.results[info.currentModule], info.nameToStore,
                       types[info.nameToStore]);
  };

  const onExit = (env, { saveIfAble, printIfAble }) => {
    saveIfAble();
    printIfAble();
  };
  
  env = lya.createLyaState({
    context: {
      include: ['module-returns'],
    },
    hooks: {
      onCallPre,
      onCallPost,
      onExit,
    }
  });

  return env;
};
