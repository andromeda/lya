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

// One handler to rule them all
const moduleHandler = {
  apply: function(target, thisArg, argumentsList) {
    const currentName = locEnv.objPath.get(target);
    const birthplace = locEnv.objName.get(target); // module-returns
    const currentModule = locEnv.moduleName[locEnv.requireLevel];
    if (target.name === 'require') {
      const origReqModuleName = argumentsList[0];
      exportObj('require', 'rx');
      locEnv.analysisResult[currentModule]['require(\'' +
        origReqModuleName + '\')'] = 'i';
    } else if (locEnv.methodNames.has(target)) {
      updateAnalysisData(locEnv.analysisResult[currentName],
          locEnv.methodNames.get(target).split('.')[0], 'r');
      updateAnalysisData(locEnv.analysisResult[currentName],
          locEnv.methodNames.get(target), 'rx');
    } else if (birthplace) {
      if (currentModule === currentName) {
        const truename = birthplace + '.' + target.name;
        updateAnalysisData(locEnv.analysisResult[currentName], truename, 'x');
      }
    }
    else {
      updateAnalysisData(locEnv.analysisResult[currentName], target.name, 'r');
      updateAnalysisData(locEnv.analysisResult[currentName], target.name, 'x');
    }

    return Reflect.apply(target, thisArg, argumentsList);
  },
  get: function(target, name) {
    const currentName = locEnv.objPath.get(target);
    if (locEnv.globalNames.has(name)) {
      const moduleName = locEnv.moduleName[locEnv.requireLevel];
      updateAnalysisData(locEnv.analysisResult[moduleName],
        locEnv.globalNames.get(name).split('.')[0], 'r');
      updateAnalysisData(locEnv.analysisResult[moduleName],
        locEnv.globalNames.get(name), 'r');
    } else if (locEnv.globalNames.has(target[name])) {
      updateAnalysisData(locEnv.analysisResult[currentName],
        locEnv.globalNames.get(target[name]).split('.')[0], 'r');
      updateAnalysisData(locEnv.analysisResult[currentName],
        locEnv.globalNames.get(target[name]), 'r');
    } else if (locEnv.methodNames.has(target[name])) {
      updateAnalysisData(locEnv.analysisResult[currentName],
          locEnv.methodNames.get(target[name]), 'r');
    } else if (locEnv.methodNames.has(target) &&
        locEnv.methodNames.get(target) !== 'global') {
      updateAnalysisData(locEnv.analysisResult[currentName],
          locEnv.methodNames.get(target), 'r');
    } else if (target.name) {
      updateAnalysisData(locEnv.analysisResult[currentName], target.name, 'r');
    }

    return Reflect.get(target, name);
  },
  set: function(target, name, value) {
    const currentName = locEnv.objPath.get(target);
    if (locEnv.methodNames.has(target)) {
      const nameToStore = locEnv.methodNames.get(target) + '.' + name;
      updateAnalysisData(locEnv.analysisResult[currentName],
          locEnv.methodNames.get(target), 'r');
      updateAnalysisData(locEnv.analysisResult[currentName], nameToStore, 'w');
      if (locEnv.methodNames.get(target) === 'global') {
        locEnv.globalNames.set(name, nameToStore);
      }
    }
    return Reflect.set(target, name, value);
  },
  construct: function(target, args) {
    const currentName = locEnv.moduleName[locEnv.requireLevel];
    if (target.name !== 'Proxy') {
      updateAnalysisData(locEnv.analysisResult[currentName], target.name, 'r');
      updateAnalysisData(locEnv.analysisResult[currentName], target.name, 'x');
    }
    return new target(...args);
  }
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

module.exports = (env) => {
  locEnv = env;
  return {
    moduleHandler: moduleHandler,
    readFunction: readFunction,
    updateRestData: updateRestData,
    exportObj: exportObj,
    updateAnalysisData : updateAnalysisData,
  };
};
