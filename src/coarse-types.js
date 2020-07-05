let env;
const fs = require('fs');

const updateAnalysisData = (storedCalls, truename, type) => {
  if (Object.prototype.hasOwnProperty.
      call(storedCalls, type) === false) {
    storedCalls[type] = {};
    storedCalls[type][truename] = {};
  } else {
    if (Object.prototype.hasOwnProperty.
        call(storedCalls[type], truename) === false) {
      storedCalls[type][truename] = {};
    }
  }
};

// onCallPre <~ is called before the execution of a function
const onCallPre = (target, thisArg, argumentsList, name, nameToStore,
    currentModule, declareModule, typeClass) => {
  updateAnalysisData(env.analysisResult, nameToStore, 'function');
};

// onExit (toSave == place to save the result) --maybe make it module-local?
const onExit = (intersection, candidateModule) => {
  if (env.conf.SAVE_RESULTS) {
    fs.writeFileSync(env.conf.SAVE_RESULTS,
        JSON.stringify(env.analysisResult, null, 2), 'utf-8');
  }
};

module.exports = (e) => {
  env = e;
  return {
    onCallPre: onCallPre,
    onExit: onExit,
  };
};
