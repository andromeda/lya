// env is {
//   trueName : trueName,
//   requireLevel : requireLevel,
//   accessMatrix: accessMatrix,
//   timeCapsule : timeCapsule,
// }
let locEnv;

// Holds the end of each name store of new assigned global variables
// suffix for our own metadata
const endName = '@name';

// Normalize all values (seconds and to microseconds)
let toMillis = (a, b) => (a * 1e9 + b) * 1e-6;

// The handler of require of Counter case_4
const RequireTime2= {
  apply: function(target) {
    const currentName = locEnv.trueName[locEnv.requireLevel];
    const nameReq = target.name + '(\'' + arguments[2][0] +// In arguments[2][0]
      '\')';// Is the name we use to import
    const time = process.hrtime();
    const result = Reflect.apply( ...arguments);
    const diff = process.hrtime(time);
    if (locEnv.timeCapsule[locEnv.requireLevel]) {
      locEnv.timeCapsule[locEnv.requireLevel] += toMillis(diff[0], diff[1]);
    } else {
      locEnv.timeCapsule[locEnv.requireLevel] = toMillis(diff[0], diff[1]);
    }

    if (locEnv.timeCapsule[locEnv.requireLevel+1] != undefined) {
      locEnv.accessMatrix[currentName][nameReq] = locEnv.timeCapsule[locEnv.requireLevel] -
        locEnv.timeCapsule[locEnv.requireLevel+1];
      locEnv.timeCapsule[locEnv.requireLevel+1] = 0;
    } else {
      locEnv.accessMatrix[currentName][nameReq] = locEnv.timeCapsule[locEnv.requireLevel];
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
      if (locEnv.timeCapsule[locEnv.requireLevel]) {
        locEnv.timeCapsule[locEnv.requireLevel] += toMillis(diff[0], diff[1]);
      } else {
        locEnv.timeCapsule[locEnv.requireLevel] = toMillis(diff[0], diff[1]);
      }

      if (locEnv.timeCapsule[locEnv.requireLevel+1] != undefined) {
        storedCalls[truename] = locEnv.timeCapsule[locEnv.requireLevel] -
          locEnv.timeCapsule[locEnv.requireLevel+1];
        locEnv.timeCapsule[locEnv.requireLevel+1] = 0;
      } else {
        storedCalls[truename] = locEnv.timeCapsule[locEnv.requireLevel];
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
      if (locEnv.timeCapsule[locEnv.requireLevel]) {
        locEnv.timeCapsule[locEnv.requireLevel] += toMillis(diff[0], diff[1]);
      } else {
        locEnv.timeCapsule[locEnv.requireLevel] = toMillis(diff[0], diff[1]);
      }

      if (locEnv.timeCapsule[locEnv.requireLevel+1]) {
        storedCalls[truename] = locEnv.timeCapsule[locEnv.requireLevel] -
          locEnv.timeCapsule[locEnv.requireLevel+1];
        locEnv.timeCapsule[locEnv.requireLevel+1] = 0;
      } else {
        storedCalls[truename] = locEnv.timeCapsule[locEnv.requireLevel];
      }

      return result;
    }

    return Reflect.apply(...arguments);
};

// The handler of the global variable
// Every time we access the global variabe in order to declare or call
// a variable, then we can print it on the export file. It doesnt work
// if it isn't called like global.xx
// y global.y
const handlerGlobal= {
  get: function(target, name) {
    return Reflect.get(target, name);
  },
  set: function(target, name, value) {
    return Reflect.set(target, name, value);
  },
};

// ****************************
// Handlers of Proxies
// The handler of the functions
const handler= {
  apply: function(target) {
    const currentName = locEnv.trueName[locEnv.requireLevel];

    return onModuleControlFunc(locEnv.accessMatrix[currentName],
        target.name, arguments);
  },
};

// The handler of the imported libraries
const handlerExports= {
  apply: function(target, thisArg, argumentsList) {
    let truename;

    truename = locEnv.objName.get(target);
    const currentName = locEnv.objPath.get(target);
    truename = truename + '.' + target.name;

    return exportFuncControl(locEnv.accessMatrix[currentName], truename, arguments);
  },
};

// We update the instance of require
const updateCounter = (counter) => {
  locEnv.requireLevel = counter;
}

module.exports = (env) => {
	locEnv = env;
	return {
		require : RequireTime2,
		exportFuncControl : exportFuncControl,
		onModuleControlFunc : onModuleControlFunc,
    handler : handler,
    handlerGlobal : handlerGlobal,
    handlerExports : handlerExports,
    updateCounter : updateCounter,
	}
};