/*

# Analysis interface (analysis hooks):
analysis.onRead = (target, name) => {...}
analysis.onWrite = (target, name, value) => {}
analysis.onCallPre = (target, thisArg, argumentsList) => {...}
analysis.onCallPost = (target, thisArg, argumentsList) => {...}

+ ? id of module attempting accesss: (absolute file path)
+ ? path of target from "root": [process, env, HOME]
- ? name of target: (no need, it **has to be** the last element of list)

# Utility / helper functions
lya.getObjectPath (target[name]) -> {
  absolutePath: [process, env, HOME]
}

lya.getModuleInfo (o) -> {
  absoluteID: "/blah/foo/bar/lodash.js",
  importString: "lodash.js",
}

# Options
lya.analysisDepth
lya.roots = ["user-globals", "node-globals"]
lya.granularity = ["prototype", "Object.keys", "ourFunctions"]

examples:
let x = process.env.HOME // {process: r, env: r}
let x = Math.PI          // {process: r, env: r}

root: to whom does the value belong? (full absolute name)
- user-globals: e.g., global.x, x,                                   [global, x]
- es-globals: Math, Map, Array,                                      [Math, PI]
- node-globals: console, setImmediate,                               [console, log]
- module-locals: exports, require, module, __filename, __dirname     [require]
- module-returns: exports, module.exports                            [ID, math, pi]

main:
  require("math").add(1, 2)  // [blah/foo/bar/math.js, add] [/../../main.js]
 */
let locEnv;

// Holds the end of each name store of new assigned global variables
// suffix for our own metadata
const endName = '@name';

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

// The handler of the global variable.Every time we access the global variabe
// in order to declare or call a variable, we can print it on the export file.
// e.g., global.x, global.y; but not x, y;
const globalHandler = {
  get: function(target, name) {
    // XXX[target] != 'undefined'
    if (typeof name === 'string') {
      if (typeof target[name+endName] != 'undefined') {
        const currentName = locEnv.moduleName[locEnv.requireLevel];
        const nameToShow = target[name+endName];
        updateAnalysisData(locEnv.analysisResult[currentName], 'global', 'r');
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
// handler of Prologue:
// e.g., console.log, Array, Math, Object, ...
const moduleHandler = {
  apply: function(target, thisArg, argumentsList) {
    const currentName = locEnv.objPath.get(target);
    if (target.name === 'require') {
      const moduleName = locEnv.moduleName[locEnv.requireLevel];
      const origReqModuleName = argumentsList[0];
      exportObj('require', 'rx');
      locEnv.analysisResult[moduleName]['require(\'' +
        origReqModuleName + '\')'] = 'i';
    } else if (locEnv.methodNames.has(target)) {
      updateAnalysisData(locEnv.analysisResult[currentName],
          locEnv.methodNames.get(target).split('.')[0], 'r');
      updateAnalysisData(locEnv.analysisResult[currentName],
          locEnv.methodNames.get(target), 'rx');
    } else {
      updateAnalysisData(locEnv.analysisResult[currentName], target.name, 'r');
      updateAnalysisData(locEnv.analysisResult[currentName], target.name, 'x');
    }
    return Reflect.apply(target, thisArg, argumentsList);
  },
  get: function(target, name) {
    const currentName = locEnv.objPath.get(target);
    if (locEnv.globalNames.has(target[name])) {
      updateAnalysisData(locEnv.analysisResult[currentName],
        locEnv.globalNames.get(target[name]).split('.')[0], 'r');
      updateAnalysisData(locEnv.analysisResult[currentName],
        locEnv.globalNames.get(target[name]), 'r');
    } else if (locEnv.methodNames.has(target[name])) {
      updateAnalysisData(locEnv.analysisResult[currentName],
          locEnv.methodNames.get(target), 'r');
    } else if (locEnv.methodNames.has(target)) {
      updateAnalysisData(locEnv.analysisResult[currentName],
          locEnv.methodNames.get(target), 'r');
    // TODO: remove the target.name from here
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

// The handler of the functions on the export module. Every time we
// require a module and we have exports, we wrap them in a handler.
// Each time we call a function from inside exports this is the handler
// that we wrap the function.
// e.g., module.exports --- but only function application?
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
    globalHandler: globalHandler,
    readFunction: readFunction,
    exportsFuncHandler: exportsFuncHandler,
    updateRestData: updateRestData,
    exportObj: exportObj,
  };
};
