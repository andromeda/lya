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
// Given those two inputs we can update the analysis data that are stored
// in storedCalls.
const updateAnalysisData = (storedCalls, truename, mode) => {
  if (Object.prototype.hasOwnProperty.
      call(storedCalls, truename) === false) {
    storedCalls[truename] = mode;
  } else {
    addEvent(mode, storedCalls, truename);
  }
};

const exportObj = (name, action) => {
  action = (action === undefined) ? 'w' : action;
  const currentName = locEnv.moduleName[locEnv.requireLevel];

  if (name.split('.').length === 3) {
    updateAnalysisData(locEnv.analysisResult[currentName],
        name.split('.')[0] + '.' + name.split('.')[1], 'r');
  }
  updateAnalysisData(locEnv.analysisResult[currentName], name, action);
};

// Read function so we print it in the export file
// This is to catch the read of a called function
// require("math.js").fft && require("math.js").fft.mult
const readFunction = (name, type) => {
  const currentPlace = locEnv.moduleName[locEnv.requireLevel];
  const storedCalls = locEnv.analysisResult[currentPlace];
  const action = type === 'function' ? 'rx' : 'r';

  if (Object.prototype.hasOwnProperty.
      call(storedCalls, name) === false) {
    storedCalls[name] = action;
  } else {
    addEvent(action, storedCalls, name);
  }
};

// Analyses provided by LYA.
// onRead <~ is called before every object is read
const onRead = (target, name, nameToStore, currentModule, typeClass) => {
    if (nameToStore != 'global') {
      updateAnalysisData(locEnv.analysisResult[currentModule],
        nameToStore.split('.')[0], 'r');
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
    exportObj('require', 'rx');
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
    readFunction: readFunction,
    exportObj: exportObj,
    updateAnalysisData: updateAnalysisData,
    onRead: onRead,
    onCallPre: onCallPre,
    onCallPost: onCallPost,
    onWrite: onWrite,
    onConstruct: onConstruct,
  };
};
