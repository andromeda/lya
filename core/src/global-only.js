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

// Analyses provided by LYA.
// onRead <~ is called before every object is read
const onRead = (target, name, nameToStore, currentModule, typeClass) => {
};

// onWrite <~ is called before every write of an object
const onWrite = (target, name, value, currentModule, parentName,
    nameToStore) => {
}

// onCallPre <~ is called before the execution of a function
const onCallPre = (target, thisArg, argumentsList, name, nameToStore,
    currentModule, declareModule, typeClass) => {
  if (typeClass === 'es-globals' || typeClass === 'node-globals' ) {
    updateAnalysisData(env.analysisResult[currentModule], nameToStore);
  }
};

// onCallPost <~ Is call after every execution of a function
const onCallPost = (target, thisArg, argumentsList, name, nameToStore,
    currentModule, declareModule, typeClass, result) => {
};

// onConstruct <~ Is call before every construct
const onConstruct = (target, args, currentName, nameToStore) => {
  updateAnalysisData(env.analysisResult[currentName],
      nameToStore, ['r', 'x']);
};

const onHas = (target, prop, currentName, nameToStore) => {
};

// onExit (toSave == place to save the result) --maybe make it module-local?
const onExit = (intersection, candidateModule) => {
  fs.writeFileSync(env.conf.SAVE_RESULTS, JSON.stringify(env.analysisResult,
    null, 2), 'utf-8');
}

module.exports = (e) => {
  env = e;
  return {
    onRead: onRead,
    onCallPre: onCallPre,
    onCallPost: onCallPost,
    onWrite: onWrite,
    onConstruct: onConstruct,
    onHas: onHas,
    onExit: onExit,
  };
};
