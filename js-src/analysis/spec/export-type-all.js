let env;
const fs = require('fs');
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
  updateAnalysisData(env.analysisResult[info.currentModule], info.nameToStore,
      inputType, outputType);
};

// onExit (toSave == place to save the result) --maybe make it module-local?
const onExit = (intersection, candidateModule) => {
  if (env.conf.SAVE_RESULTS) {
    fs.writeFileSync(env.conf.SAVE_RESULTS,
        JSON.stringify(env.analysisResult, null, 2), 'utf-8');
  }
  if (env.conf.print) {
    console.log(JSON.stringify(env.analysisResult, null, 2));
  }
};

module.exports = (e) => {
  env = e;
  return {
    onCallPre: onCallPre,
    onCallPost: onCallPost,
    onExit: onExit,
  };
};
