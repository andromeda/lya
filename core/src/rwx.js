let locEnv;

// We add the R or W or E to the existing string
const addEvent = (event, values, index) => {
  let permissions = values[index];
  if (!permissions.includes(event)) {
    permissions += event;
    permissions = permissions.split('').sort().join('');
    values[index] = permissions;
  }
};

// @storedCalls it is a table that contains all the analysis data
// @truename the name of the current function, object etc that we want to add to
// the table
// @mode the mode of the current access (R,W or E)
const updateAnalysisData = (storedCalls, truename, mode) => {
  if (Object.prototype.hasOwnProperty.
      call(storedCalls, truename) === false) {
    storedCalls[truename] = mode;
  } else {
    addEvent(mode, storedCalls, truename);
  }
};

// Analyses provided by LYA.
// onRead <~ is called before every object is read
const onRead = (target, name, nameToStore, currentModule, typeClass) => {
    if (nameToStore != 'global') {
      // TODO: fix case for test 7
      const pattern = /require[(](.*)[)]/;
      if (pattern.test(nameToStore)) {
        updateAnalysisData(locEnv.analysisResult[currentModule],
          nameToStore.match(pattern)[0], 'r');
      } else {
        updateAnalysisData(locEnv.analysisResult[currentModule],
          nameToStore.split('.')[0], 'r');
      }
      updateAnalysisData(locEnv.analysisResult[currentModule],
        nameToStore, 'r');
    }
}

// onWrite <~ is called before every write of an object
const onWrite = (target, name, value, currentModule, parentName, nameToStore) => {
  updateAnalysisData(locEnv.analysisResult[currentModule], parentName, 'r');
  updateAnalysisData(locEnv.analysisResult[currentModule], nameToStore, 'w');
}

// onCallPre <~ is called before the execution of a function
const onCallPre = (target, name, nameToStore, currentModule, declareModule,
  typeClass) => {
  if (typeClass === 'module-locals') {
    updateAnalysisData(locEnv.analysisResult[currentModule],
      'require', 'r');
    updateAnalysisData(locEnv.analysisResult[currentModule],
      'require', 'x');
    updateAnalysisData(locEnv.analysisResult[currentModule],
      nameToStore, 'i');
  } else {
    if (typeClass === 'node-globals') {
      updateAnalysisData(locEnv.analysisResult[declareModule],
        nameToStore.split('.')[0], 'r');
    }
    updateAnalysisData(locEnv.analysisResult[declareModule],
      nameToStore, 'r');
    updateAnalysisData(locEnv.analysisResult[declareModule],
      nameToStore, 'x');
  }
};

// onCallPost <~ Is call after every execution of a function
const onCallPost = (target, name, nameToStore, currentModule, declareModule,
  typeClass, result) => {
}

// onConstruct <~ Is call before every construct
const onConstruct = (target, args, currentName, nameToStore) => {
  updateAnalysisData(locEnv.analysisResult[currentName], nameToStore, 'r');//Analysis
  updateAnalysisData(locEnv.analysisResult[currentName], nameToStore, 'x');//Analysis
}

module.exports = (env) => {
  locEnv = env;
  return {
    onRead: onRead,
    onCallPre: onCallPre,
    onCallPost: onCallPost,
    onWrite: onWrite,
    onConstruct: onConstruct,
  };
};
