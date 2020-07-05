let env;
const fs = require('fs');

// @storedCalls it is a table that contains all the analysis data
// @name the name of the current function, object etc that we want to add to
// the table
const updateAnalysisData = (analysisResult, name) => {
  if (!Object.prototype.hasOwnProperty.call(analysisResult, name)) {
    analysisResult[name] = true;
  }
};

// Change the time parameters
const convert = (hrtime) => {
  const nanos = (hrtime[0] * 1e9) + hrtime[1];
  const millis = nanos / 1e6;
  const secs = nanos / 1e9;
  return {secs: secs, millis: millis, nanos: nanos};
};

// onCallPre <~ is called before the execution of a function
const onCallPre = (target, thisArg, argumentsList, name, nameToStore,
    currentModule, declareModule, typeClass) => {
  if (typeClass === 'es-globals' || typeClass === 'node-globals' ) {
    updateAnalysisData(env.analysisResult[currentModule], nameToStore);
  }
};

// onConstruct <~ Is call before every construct
const onConstruct = (target, args, currentName, nameToStore) => {
  updateAnalysisData(env.analysisResult[currentName],
      nameToStore, ['r', 'x']);
};

// onExit (toSave == place to save the result) --maybe make it module-local?
const onExit = (intersection, candidateModule) => {
  if (env.conf.reportTime) {
    const timerEnd = process.hrtime(env.conf.timerStart);
    const timeMillis = convert(timerEnd).millis;
    console.log(timeMillis, 'Time');
  }
  if (env.conf.SAVE_RESULTS) {
    fs.writeFileSync(env.conf.SAVE_RESULTS,
        JSON.stringify(env.analysisResult, null, 2), 'utf-8');
  }
};

module.exports = (e) => {
  env = e;
  return {
    onCallPre: onCallPre,
    onConstruct: onConstruct,
    onExit: onExit,
  };
};
