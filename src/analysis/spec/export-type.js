let env;
const fs = require('fs');
const types = [];

const updateAnalysisData = (storedCalls, truename, types) => {
  const saveData = {core: types};
  if (Object.prototype.hasOwnProperty.
      call(storedCalls, truename) === false) {
    storedCalls[truename] = saveData;
  }
};

// onCallPre <~ is called before the execution of a function
const onCallPre = (target, thisArg, argumentsList, name, nameToStore,
    currentModule, declareModule, typeClass) => {
  const inputType = [];
  if (!argumentsList.length) {
    inputType.push('no-input');
  } else {
    for (let i = 0; i < argumentsList.length; i++) {
      inputType.push(typeof argumentsList[i]);
    }
  }
  types[nameToStore] = inputType;
};

// onCallPost <~ Is call after every execution of a function
const onCallPost = (target, thisArg, argumentsList, name, nameToStore,
    currentModule, declareModule, typeClass, result) => {
  types[nameToStore].push(result ? typeof result : 'no output');
  updateAnalysisData(env.analysisResult[currentModule], nameToStore,
      types[nameToStore]);
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
  env.conf.context.include = ['module-returns'];
  return {
    onCallPre: onCallPre,
    onCallPost: onCallPost,
    onExit: onExit,
  };
};
