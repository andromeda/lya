// env is {
//   trueName : trueName,
//   requireLevel : requireLevel,
//   accessMatrix: accessMatrix,
// }
let locEnv;

// Holds the end of each name store of new assigned global variables
// suffix for our own metadata
const endName = '@name';

// Array to store the time of the modules
const timeCapsule = {};

// Normalize all values (seconds and to microseconds)
let toMillis = (a, b) => (a * 1e9 + b) * 1e-6;

const updateRestData = (target, name, type) => {
};

// This the handler of the require function. Every time a "require" is used to load up a module
// this handler is called. It updates the analysis data that are stored in the accessMatrix table.
// TODO: add more
const requireHandler = {
  apply: function(target) {
    const currentName = locEnv.trueName[locEnv.requireLevel];
    const nameReq = target.name + '(\'' + arguments[2][0] +// In arguments[2][0]
      '\')';// Is the name we use to import
    const time = process.hrtime();
    const result = Reflect.apply( ...arguments);
    const diff = process.hrtime(time);
    const thisTime = toMillis(diff[0], diff[1]);
    if (timeCapsule[locEnv.requireLevel]) {
      timeCapsule[locEnv.requireLevel] += toMillis(diff[0], diff[1]);
    } else {
      timeCapsule[locEnv.requireLevel] = toMillis(diff[0], diff[1]);
    }

    if (timeCapsule[locEnv.requireLevel+1] != undefined) {
      locEnv.accessMatrix[currentName][nameReq] = thisTime -
        timeCapsule[locEnv.requireLevel+1];
      timeCapsule[locEnv.requireLevel+1] = 0;
    } else {
      locEnv.accessMatrix[currentName][nameReq] = thisTime;
    }

    return result;
  },
};

const exportFuncControl = (storedCalls, truename, arguments) => {
	if (Object.prototype.hasOwnProperty.
        call(storedCalls, truename) === false) {
      const time = process.hrtime();
      const result = Reflect.apply( ...arguments);
      const diff = process.hrtime(time);
      const thisTime = toMillis(diff[0], diff[1]);

      if (timeCapsule[locEnv.requireLevel]) {
        timeCapsule[locEnv.requireLevel] += toMillis(diff[0], diff[1]);
      } else {
        timeCapsule[locEnv.requireLevel] = toMillis(diff[0], diff[1]);
      }

      if (timeCapsule[locEnv.requireLevel+1] != undefined) {
        storedCalls[truename] = thisTime -
          timeCapsule[locEnv.requireLevel+1];
        timeCapsule[locEnv.requireLevel+1] = 0;
      } else {
        storedCalls[truename] = thisTime;
      }

      return result;
    }

    return Reflect.apply(...arguments);
};

const onModuleControlFunc = (storedCalls, truename, arguments) => {
	if (Object.prototype.hasOwnProperty.
        call(storedCalls, truename) === false) {
      const time = process.hrtime();
      const result = Reflect.apply( ...arguments);
      const diff = process.hrtime(time);
      const thisTime = toMillis(diff[0], diff[1]);

      if (timeCapsule[locEnv.requireLevel]) {
        timeCapsule[locEnv.requireLevel] += toMillis(diff[0], diff[1]);
      } else {
        timeCapsule[locEnv.requireLevel] = toMillis(diff[0], diff[1]);
      }

      if (timeCapsule[locEnv.requireLevel+1]) {
        storedCalls[truename] = thisTime -
          timeCapsule[locEnv.requireLevel+1];
        timeCapsule[locEnv.requireLevel+1] = 0;
      } else {
        storedCalls[truename] = thisTime;
      }

      return result;
    }

    return Reflect.apply(...arguments);
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
    const currentName = locEnv.trueName[locEnv.requireLevel];

    return onModuleControlFunc(locEnv.accessMatrix[currentName],
        target.name, arguments);
  },
};

// The handler of the functions on the export module. Every time we require a module 
// and we have exports, we wrap them in a handler. Each time we call a function from inside
// exports this is the handler that we wrap the function.
const exportsFuncHandler = {
  apply: function(target, thisArg, argumentsList) {
    let truename;

    truename = locEnv.objName.get(target);
    const currentName = locEnv.objPath.get(target);
    truename = truename + '.' + target.name;

    return exportFuncControl(locEnv.accessMatrix[currentName], truename, arguments);
  },
};

// Read function so we print it in the export file
// This is to catch the read
const readFunction = (myFunc, name) => {
}

// This is the handler of the global constanst variables, like Math.PI etc. We store the name 
// in the same object but we use a different name, for example, for Math.PI we store the 
// name "Math.PI" in the object Math.PIPI. That way we can have accurate name analysis.
const globalConstHandler = {
  get: function(target, name) {
    // Do nothing ~> we dont care about constants in this analysis
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
	}
};