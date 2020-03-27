let locEnv;

const updateRestData = (target, name, type) => {
  exportObj(locEnv.objName.get(target) + '.' +name, 'r');
};

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

const onRead = (target, name, nameToStore, currentModule, declareModule,
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

}

const onWrite = (target, name, value) => {
}

const onCallPre = (target, thisArg, argumentsList) => {
}

const onCallPost = (target, thisArg, argumentsList) => {
}

const onConstruct = (target, thisArg, argumentsList) => {
}
module.exports = (env) => {
  locEnv = env;
  return {
    readFunction: readFunction,
    updateRestData: updateRestData,
    exportObj: exportObj,
    updateAnalysisData : updateAnalysisData,
    onRead : onRead,
  };
};
