// This is the analysis for coarse type
// *****************************************

// This is the policy for true false analysis. Each time we access a variable
// or a function we write it with true in a export file dynamic.json
let locEnv;

// Holds the end of each name store of new assigned global variables
// suffix for our own metadata
const endName = '@name';

// @storedCalls it is a table that contains all the analysis data
// @truename the name of the current function, object etc that we want to add to
// the table
// @inputType the type of the inputs of the function ~> as a string
// @outputType the type of the output of the function ~> as a string
// Update the analysis data that are stored in storedCalls
const updateAnalysisData = (storedCalls, truename, type) => {
  if (Object.prototype.hasOwnProperty.
      call(storedCalls, type) === false) {
    storedCalls[type] = {};
    storedCalls[type][truename] = {};
  } else {
    if (Object.prototype.hasOwnProperty.
        call(storedCalls[type], truename) === false) {
      storedCalls[type][truename] = {};
    }
  }
};

const updateRestData = (target, name, type) => {
  // This is for the names
  let truename = locEnv.objName.get(target);
  truename = truename + '.' + name;
  updateAnalysisData(locEnv.accessMatrix, truename, type);
};

const exportObj = () => {
};


// This the handler of the require function. Every time a "require" is used to load up a module
// this handler is called. It updates the analysis data that are stored in the accessMatrix table.
const requireHandler = {
  apply: function(target, thisArg, argumentsList) {
    const currentName = locEnv.trueName[locEnv.requireLevel];
    const origReqModuleName = argumentsList[0];
    // locEnv.accessMatrix[currentName]['require(\'' + origReqModuleName + '\')'] = true;
    return Reflect.apply(...arguments);
  },
};

// The handler of the global variable.Every time we access the global variabe in order to declare
// or call a variable, then we can print it on the export file.
const globalHandler = {
  get: function(target, name) {
    return Reflect.get(target, name);
  },
  set: function(target, name, value) {
    return Reflect.set(target, name, value);
  },
};

// The handler of the all the function that are called inside a module. Every time we
// load a module with require it first execute all the code and then prepary and exports
// all the export data. We use this handler to catch all the code that is executed on the
// module.
const moduleHandler = {
  apply: function(target) {
    return Reflect.apply(...arguments);
  },
  get: function(target, name) {
    return Reflect.get(target, name);
  },
};

// The handler of the functions on the export module. Every time we require a module
// and we have exports, we wrap them in a handler. Each time we call a function from inside
// exports this is the handler that we wrap the function.
const exportsFuncHandler = {
  apply: function(target, thisArg, argumentsList) {
    // This is for the names
    let truename = locEnv.objName.get(target);
    truename = truename + '.' + target.name;
    updateAnalysisData(locEnv.accessMatrix, truename, 'function');

    return Reflect.apply(...arguments);
  },
};

// Read function so we print it in the export file
// This is to catch the read
const readFunction = (myFunc, name) => {
};

// This is the handler of the global constanst variables, like Math.PI etc. We store the name
// in the same object but we use a different name, for example, for Math.PI we store the
// name "Math.PI" in the object Math.PIPI. That way we can have accurate name analysis.
const globalConstHandler = {
  get: function(target, name) {
    return Reflect.get(target, name);
  },
};

module.exports = (env) => {
  locEnv = env;
  return {
    require: requireHandler,
    globalHandler: globalHandler,
    moduleHandler: moduleHandler,
    readFunction: readFunction,
    exportsFuncHandler: exportsFuncHandler,
    globalConstHandler: globalConstHandler,
    updateRestData: updateRestData,
    exportObj: exportObj,
  };
};
