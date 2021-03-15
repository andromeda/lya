let env;
const pattern = /require[(](.*)[)]/;
const fs = require('fs');

// @storedCalls it is a table that contains all the analysis data
// @truename the name of the current function, object etc that we want to add to
// the table
const updateAnalysisData = (storedCalls, truename) => {
  if (Object.prototype.hasOwnProperty.
      call(storedCalls, truename) === false) {
    storedCalls[truename] = true;
  }
};

// Analyses provided by LYA.
// onRead <~ is called before every object is read
const onRead = (info) => {
  if (info.nameToStore !== 'global') {
    if (pattern.test(info.nameToStore)) {
      updateAnalysisData(env.analysisResult[info.currentModule],
          info.nameToStore.match(pattern)[0]);
    } else {
      updateAnalysisData(env.analysisResult[info.currentModule],
          info.nameToStore.split('.')[0]);
    }
    updateAnalysisData(env.analysisResult[info.currentModule],
        info.nameToStore);
  }
};

// onWrite <~ is called before every write of an object
const onWrite = (info) => {
  if (info.parentName) {
    updateAnalysisData(env.analysisResult[info.currentModule], info.parentName);
  }
  updateAnalysisData(env.analysisResult[info.currentModule], info.nameToStore);
};

// onCallPre <~ is called before the execution of a function
const onCallPre = (info) => {
  if (info.typeClass === 'module-locals') {
    updateAnalysisData(env.analysisResult[info.currentModule],
        'require');
    updateAnalysisData(env.analysisResult[info.currentModule],
        info.nameToStore);
  } else {
    if (info.typeClass === 'node-globals') {
      updateAnalysisData(env.analysisResult[info.declareModule],
          info.nameToStore.split('.')[0]);
    }
    updateAnalysisData(env.analysisResult[info.declareModule],
        info.nameToStore);
    if (pattern.test(info.nameToStore)) {
      updateAnalysisData(env.analysisResult[info.currentModule],
          info.nameToStore.match(pattern)[0]);
    }
  }
};

// onConstruct <~ Is call before every construct
const onConstruct = (info) => {
  updateAnalysisData(env.analysisResult[info.currentName],
      info.nameToStore);
};

// onExit (toSave == place to save the result) --maybe make it module-local?
const onExit = (intersection, candidateModule) => {
  for (const name of intersection) {
    const currentName = candidateModule.get(name);
    updateAnalysisData(env.analysisResult[currentName],
        name, ['w']);
  }
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
    onRead: onRead,
    onCallPre: onCallPre,
    onWrite: onWrite,
    onConstruct: onConstruct,
    onExit: onExit,
  };
};
