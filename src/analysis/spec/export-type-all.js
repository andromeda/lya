const fs = require('fs');

module.exports = (lya) => {
  const env = lya.createLyaState();
  const inputStore = [];

  const updateAnalysisData = (storedCalls, truename, inputType, outputType) => {
    const saveData = 'input: ' + inputType + ' => output: ' + outputType;
    if (Object.prototype.hasOwnProperty.
        call(storedCalls, truename) === false) {
      storedCalls[truename] = saveData;
    } else {
      if (!storedCalls[truename].includes(saveData)) {
        storedCalls[truename] += ' || ' + saveData;
      }
    }
  };

  // onCallPre <~ is called before the execution of a function
  const onCallPre = (info) => {
    let inputType = '';
    if (!info.argumentsList.length) {
      inputType += 'no-input';
    } else {
      for (let i = 0; i < info.argumentsList.length; i++) {
        inputType += i + '.' + typeof info.argumentsList[i] + ' ';
      }
    }
    inputStore[info.nameToStore] = inputType;
  };

  // onCallPost <~ Is call after every execution of a function
  const onCallPost = (info) => {
    const inputType = inputStore[info.nameToStore];
    const outputType = info.result ? typeof info.result : 'no output';
    updateAnalysisData(env.results[info.currentModule],
                       info.nameToStore,
                       inputType,
                       outputType);
  };

  Object.assign(env.config.hooks, {
    onCallPre,
    onCallPost,
    onExit,
  });

  return env;
};
