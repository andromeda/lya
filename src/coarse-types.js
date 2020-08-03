let env;
const fs = require('fs');

const updateAnalysisData = (analysisJSON, name, type) => {
  if (Object.prototype.hasOwnProperty.
      call(analysisJSON, name) === false) {
    analysisJSON[name] = 'function';
  }
};

const onCallPre = (target, thisArg, argumentsList, name, nameToStore,
    currentModule, declareModule, typeClass) => {
  updateAnalysisData(env.analysisResult[currentModule], nameToStore,
    'function');
};

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
