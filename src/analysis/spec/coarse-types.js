let env;
const fs = require('fs');

const updateAnalysisData = (analysisJSON, name, type) => {
  if (Object.prototype.hasOwnProperty.
      call(analysisJSON, name) === false) {
    analysisJSON[name] = 'function';
  }
};

const onCallPre = (info) => {
  updateAnalysisData(env.analysisResult[info.currentModule], info.nameToStore,
      'function');
};

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
    onExit: onExit,
  };
};
