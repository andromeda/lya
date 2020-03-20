let locEnv;

// Holds the end of each name store of new assigned global variables
// suffix for our own metadata
const endName = '@name';

// This the handler of the require function. Every time a "require"
// is used to load up a module this handler is called. It updates
// the analysis data that are stored in the analysisResult table.
const requireHandler = {
  apply: function(target, thisArg, argumentsList) {
    const currentName = locEnv.moduleName[locEnv.requireLevel];
    const origReqModuleName = argumentsList[0];
    exportObj('require', 'x');
    locEnv.analysisResult[currentName]['require(\'' +
      origReqModuleName + '\')'] = 'x';
    return Reflect.apply(target, thisArg, argumentsList);
  },
  get: function(target, name) {
    const currentName = locEnv.moduleName[locEnv.requireLevel];
    if (locEnv.methodNames.has(target)) {
      updateAnalysisData(locEnv.analysisResult[currentName],
          locEnv.methodNames.get(target), 'r');
    }
    return Reflect.get(target, name);
  },
  set: function(target, name, value) {
    const currentName = locEnv.moduleName[locEnv.requireLevel];
    if (locEnv.methodNames.has(target)) {
      const nameToStore = locEnv.methodNames.get(target) + '.' + name;
      updateAnalysisData(locEnv.analysisResult[currentName],
          locEnv.methodNames.get(target), 'r');
      updateAnalysisData(locEnv.analysisResult[currentName], nameToStore, 'w');
    }
    return Reflect.set(target, name, value);
  },

};

const updateRestData = (target, name, type) => {
  exportObj(locEnv.objName.get(target) + '.' +name, 'r');
};

// TODO:find a more elegant way for the order
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
  updateAnalysisData(locEnv.analysisResult[currentName], name, action);
};

// The handler of the global variable.Every time we access the global variabe
// in order to declare or call a variable, we can print it on the export file.
const globalHandler = {
  get: function(target, name) {
    // XXX[target] != 'undefined'
    if (typeof name === 'string') {
      if (typeof target[name+endName] != 'undefined') {
        const currentName = locEnv.moduleName[locEnv.requireLevel];
        const nameToShow = target[name+endName];
        updateAnalysisData(locEnv.analysisResult[currentName], nameToShow, 'r');
      }
    }

    return Reflect.get(target, name);
  },
  set: function(target, name, value) {
    if (typeof value === 'number') {
      const currentName = locEnv.moduleName[locEnv.requireLevel];
      const nameToStore = 'global.' + name;
      const result = Reflect.set(target, name, value);
      // In order to exist a distinction between the values we declared ourselfs
      // We declare one more field with key value that stores the name
      Object.defineProperty(target, name+endName, {value: nameToStore});
      updateAnalysisData(locEnv.analysisResult[currentName], 'global', 'r');
      updateAnalysisData(locEnv.analysisResult[currentName], nameToStore, 'w');

      return result;
    }

    return Reflect.set(target, name, value);
  },
};

// The handler of the all the function that are called inside a module.
// Every time we load a module with require it first execute all the code
// and then prepare and exports all the export data. We use this handler
// to catch all the code that is executed on the module.
const moduleHandler = {
  apply: function(target, thisArg, argumentsList) {
    const currentName = locEnv.moduleName[locEnv.requireLevel];
    if (locEnv.methodNames.has(target)) {
      updateAnalysisData(locEnv.analysisResult[currentName],
          locEnv.methodNames.get(target).split('.')[0], 'r');
      updateAnalysisData(locEnv.analysisResult[currentName],
          locEnv.methodNames.get(target), 'x');
    } else {
      updateAnalysisData(locEnv.analysisResult[currentName], target.name, 'x');
    }
    return Reflect.apply(target, thisArg, argumentsList);
  },
  get: function(target, name) {
    const currentName = locEnv.moduleName[locEnv.requireLevel];
    if (locEnv.methodNames.has(target)) {
      updateAnalysisData(locEnv.analysisResult[currentName],
          locEnv.methodNames.get(target), 'r');
    } else {
      updateAnalysisData(locEnv.analysisResult[currentName], target.name, 'r');
    }

    return Reflect.get(target, name);
  },
};

// The handler of the functions on the export module. Every time we
// require a module and we have exports, we wrap them in a handler.
// Each time we call a function from inside exports this is the handler
// that we wrap the function.
const exportsFuncHandler = {
  apply: function(target, thisArg, argumentsList) {
    let truename;

    truename = locEnv.objName.get(target);
    const currentName = locEnv.moduleName[locEnv.requireLevel];
    if (currentName === locEnv.objPath.get(target)) {
      truename = truename + '.' + target.name;
      updateAnalysisData(locEnv.analysisResult[currentName], truename, 'x');
    }
    return Reflect.apply(target, thisArg, argumentsList);
  },
};

// Read function so we print it in the export file
// This is to catch the read of a called function
// require("math.js").fft && require("math.js").fft.mult
const readFunction = (myFunc, name) => {
  const wholeName = name + '.' + myFunc.name;
  const currentPlace = locEnv.moduleName[locEnv.requireLevel];
  const storedCalls = locEnv.analysisResult[currentPlace];

  if (Object.prototype.hasOwnProperty.
      call(storedCalls, name) === false) {
    storedCalls[name] = 'r';
  }

  if (Object.prototype.hasOwnProperty.
      call(storedCalls, wholeName) === false) {
    storedCalls[wholeName] = 'r';
  } else {
    addEvent('r', storedCalls, wholeName);
  }
};

const globalConstHandler = {
  get: function(target, name) {
    const currentName = locEnv.moduleName[locEnv.requireLevel];
    if (locEnv.globalNames.has(target[name])) {
      updateAnalysisData(locEnv.analysisResult[currentName],
          locEnv.globalNames.get(target[name]).split('.')[0], 'r');
      updateAnalysisData(locEnv.analysisResult[currentName],
          locEnv.globalNames.get(target[name]), 'r');
    }

    return Reflect.get(target, name);
  },
};

module.exports = (env) => {
  locEnv = env;
  return {
    require: requireHandler,
    moduleHandler: moduleHandler,
    globalHandler: globalHandler,
    readFunction: readFunction,
    exportsFuncHandler: exportsFuncHandler,
    globalConstHandler: globalConstHandler,
    updateRestData: updateRestData,
    exportObj: exportObj,
  };
};
