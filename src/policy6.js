// env is {
//   trueName : trueName,
//   requireLevel : requireLevel,
//   accessMatrix: accessMatrix,
// }
let locEnv;

// Holds the end of each name store of new assigned global variables
// suffix for our own metadata
const endName = '@name';

// This the handler of the require function. Every time a "require" is used to load up a module
// this handler is called. It updates the analysis data that are stored in the accessMatrix table.
const requireHandler = {
  apply: function(target, thisArg, argumentsList) {
    const currentName = locEnv.trueName[locEnv.requireLevel];
    const origReqModuleName = argumentsList[0];
    exportObj('require', 'x');
    locEnv.accessMatrix[currentName]['require(\'' + origReqModuleName + '\')'] = 'x';
    return Reflect.apply(...arguments);
  },
};

const updateRestData = (target, name, type) => {
};

// TODO:find a more elegant way for the order
// We add the R or W or E to the existing string
const addEvent = (event, values, index) => {
  let permissions = values[index];
  if (!permissions.includes(event)){
    permissions += event;
    permissions = permissions.split("").sort().join('');
    values[index] = permissions;
  }
};

// @storedCalls it is a table that contains all the analysis data
// @truename the name of the current function, object etc that we want to add to
// the table
// @mode the mode of the current access (R,W or E)
// Given those two inputs we can update the analysis data that are stored in storedCalls
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
  const currentName = locEnv.trueName[locEnv.requireLevel];
  updateAnalysisData(locEnv.accessMatrix[currentName], name, action);
}

// The handler of the global variable.Every time we access the global variabe in order to declare
// or call a variable, then we can print it on the export file.
const globalHandler = {
  get: function(target, name) {
    // XXX[target] != 'undefined'
    if (typeof name === 'string') {
      if (typeof target[name+endName] != 'undefined') {
        const currentName = locEnv.trueName[locEnv.requireLevel];
        const nameToShow = target[name+endName];
        updateAnalysisData(locEnv.accessMatrix[currentName], nameToShow, 'r');
      }
    }

    return Reflect.get(target, name);
  },
  set: function(target, name, value) {
    if (typeof value === 'number') {
      const currentName = locEnv.trueName[locEnv.requireLevel];
      const nameToStore = 'global.' + name;
      const result = Reflect.set(target, name, value);
      // In order to exist a disticton between the values we declared ourselfs
      // We declare one more field with key value that stores the name
      Object.defineProperty(target, name+endName, {value: nameToStore});
      updateAnalysisData(locEnv.accessMatrix[currentName], nameToStore, 'w');

      return result;
    }

    return Reflect.set(target, name, value);
  },
};

// The handler of the all the function that are called inside a module. Every time we
// load a module with require it first execute all the code and then prepary and exports
// all the export data. We use this handler to catch all the code that is executed on the
// module.
const moduleHandler = {
  apply: function(target) {
    const currentName = locEnv.trueName[locEnv.requireLevel];
    if (locEnv.methodNames.has(target)) {
      updateAnalysisData(locEnv.accessMatrix[currentName],
        locEnv.methodNames.get(target), 'x');
    } else {
      updateAnalysisData(locEnv.accessMatrix[currentName], target.name, 'x');
    }
    return Reflect.apply(...arguments);
  },
  get: function(target, name) {
    const currentName = locEnv.trueName[locEnv.requireLevel];
    updateAnalysisData(locEnv.accessMatrix[currentName], target.name, 'r');

    return Reflect.get(target, name);
  },
};

// The handler of the functions on the export module. Every time we require a module
// and we have exports, we wrap them in a handler. Each time we call a function from inside
// exports this is the handler that we wrap the function.
const exportsFuncHandler = {
  apply: function(target, thisArg, argumentsList) {
    let truename;

    truename = locEnv.objName.get(target);
    const currentName = locEnv.trueName[locEnv.requireLevel];
    if (currentName === locEnv.objPath.get(target)) {
      truename = truename + '.' + target.name;
      updateAnalysisData(locEnv.accessMatrix[currentName], truename, 'x');
    }
    return Reflect.apply(...arguments);
  },
};

// Read function so we print it in the export file
// This is to catch the read of a called function
// require("math.js").fft && require("math.js").fft.mult
const readFunction = (myFunc, name) => {

  const wholeName = name + '.' + myFunc.name;
  const currentPlace = locEnv.trueName[locEnv.requireLevel];
  let storedCalls = locEnv.accessMatrix[currentPlace];

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

// TODO: fix this by using the weakMap to store names
// This is the handler of the global constanst variables, like Math.PI etc. We store the name
// in the same object but we use a different name, for example, for Math.PI we store the
// name "Math.PI" in the object Math.PIPI. That way we can have accurate name analysis.
const globalConstHandler = {
  get: function(target, name) {
    const currentName = locEnv.trueName[locEnv.requireLevel];
    if (target[name+name]) {
      updateAnalysisData(locEnv.accessMatrix[currentName], target[name+name], 'r');
    }

    return Reflect.get(target, name);
  },
};

module.exports = (env) => {
	locEnv = env;
	return {
		require : requireHandler,
    moduleHandler : moduleHandler,
    globalHandler : globalHandler,
    readFunction : readFunction,
    exportsFuncHandler : exportsFuncHandler,
    globalConstHandler : globalConstHandler,
    updateRestData : updateRestData,
    exportObj : exportObj
	}
};
