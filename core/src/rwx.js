let locEnv;
const pattern = /require[(](.*)[)]/;

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
const updateAnalysisData = (storedCalls, truename, modeGrid) => {
  for (const key in modeGrid) {
    if (Object.prototype.hasOwnProperty.call(modeGrid, key)) {
      const mode = modeGrid[key];
      if (Object.prototype.hasOwnProperty.
          call(storedCalls, truename) === false) {
        storedCalls[truename] = mode;
      } else {
        addEvent(mode, storedCalls, truename);
      }
    }
  }
};

// Analyses provided by LYA.
// onRead <~ is called before every object is read
const onRead = (target, name, nameToStore, currentModule, typeClass) => {
  if (nameToStore !== 'global') {
    if (pattern.test(nameToStore)) {
      updateAnalysisData(locEnv.analysisResult[currentModule],
          nameToStore.match(pattern)[0], ['r']);
    } else {
      updateAnalysisData(locEnv.analysisResult[currentModule],
          nameToStore.split('.')[0], ['r']);
    }
    updateAnalysisData(locEnv.analysisResult[currentModule],
        nameToStore, ['r']);
  }
};

// onWrite <~ is called before every write of an object
const onWrite = (target, name, value, currentModule, parentName,
    nameToStore) => {
  updateAnalysisData(locEnv.analysisResult[currentModule], parentName, ['r']);
  updateAnalysisData(locEnv.analysisResult[currentModule], nameToStore, ['w']);
};

// onCallPre <~ is called before the execution of a function
const onCallPre = (target, thisArg, argumentsList, name, nameToStore,
    currentModule, declareModule, typeClass) => {
  if (typeClass === 'module-locals') {
    updateAnalysisData(locEnv.analysisResult[currentModule],
        'require', ['r', 'x']);
    updateAnalysisData(locEnv.analysisResult[currentModule],
        nameToStore, ['i']);
  } else {
    if (typeClass === 'node-globals') {
      updateAnalysisData(locEnv.analysisResult[declareModule],
          nameToStore.split('.')[0], ['r']);
    }
    updateAnalysisData(locEnv.analysisResult[declareModule],
        nameToStore, ['r', 'x']);
    if (pattern.test(nameToStore)) {
      updateAnalysisData(locEnv.analysisResult[currentModule],
        nameToStore.match(pattern)[0], ['r']);
    }
  }
};

// onCallPost <~ Is call after every execution of a function
const onCallPost = (target, thisArg, argumentsList, name, nameToStore,
    currentModule, declareModule, typeClass, result) => {
};

// onConstruct <~ Is call before every construct
const onConstruct = (target, args, currentName, nameToStore) => {
  updateAnalysisData(locEnv.analysisResult[currentName],
      nameToStore, ['r', 'x']);
};

const onHas = (target, prop, currentName, nameToStore) => {
};

module.exports = (env) => {
  locEnv = env;
  return {
    onRead: onRead,
    onCallPre: onCallPre,
    onCallPost: onCallPost,
    onWrite: onWrite,
    onConstruct: onConstruct,
    onHas: onHas,
  };
};
