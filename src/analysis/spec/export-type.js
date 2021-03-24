const fs = require('fs');

module.exports = (lya) => {
  const env = lya.createLyaState();

  env.config.context.include = ['module-returns'];

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
    updateAnalysisData(env.analysisResult[info.currentModule], info.nameToStore,
                       types[info.nameToStore]);
  };

  Object.assign(env.config.hooks, {
    onCallPre,
    onCallPost,
  });

  return env;
};
