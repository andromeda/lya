// env is {
//   trueName : trueName,
//   requireLevel : requireLevel,
//   accessMatrix: accessMatrix,
// }
let locEnv;

// Holds the end of each name store of new assigned global variables
// suffix for our own metadata
const endName = '@name';

// The handler of require of Read-Write-Execute case_1
const RequireRWE = {
  apply: function(target, thisArg, argumentsList) {
    const currentName = locEnv.trueName[locEnv.requireLevel];
    const origReqModuleName = argumentsList[0];
    locEnv.accessMatrix[currentName]['require(\'' + origReqModuleName + '\')'] = 'R';
    return Reflect.apply(...arguments);
  },
};

// We add the R or W or E to the existing string
const addEvent = (event, values, index) => {
  let storedValue = values[index];
  if (!storedValue.includes(event)){
    storedValue += event;
    values[index] = storedValue;
  }
};

const exportControl = (storedCalls, truename) => {
	if (storedCalls === 'undefined') {
    storedCalls = {};
    storedCalls[truename] = 'R';
  } else {
    addEvent('R', storedCalls, truename);
  }
};

const exportFuncControl = (storedCalls, truename, arguments) => {
	if (Object.prototype.hasOwnProperty.
        call(storedCalls, truename) === false) {
    storedCalls[truename] = 'E';
  } else {
    addEvent('E', storedCalls, truename);
  }

  return Reflect.apply(...arguments);
};

const onModuleControlFunc = (storedCalls, truename, arguments) => {
	if (Object.prototype.hasOwnProperty.
        call(storedCalls, truename) === false) {
    storedCalls[truename] = 'E';
  } else {
    addEvent('E', storedCalls, truename);
  }

  return Reflect.apply(...arguments);
};

const onModuleControl = (storedCalls, truename, mode) => {
	if (Object.prototype.hasOwnProperty.
        call(storedCalls, truename) === false) {
    storedCalls[truename] = mode;
  } else {
    addEvent(mode, storedCalls, truename);
  }
};

// The handler of the global variable
// Every time we access the global variabe in order to declare or call
// a variable, then we can print it on the export file. It doesnt work
// if it isn't called like global.xx
// y global.y
const handlerGlobal= {
  get: function(target, name) {
    // XXX[target] != 'undefined'
    if (typeof target[name+endName] != 'undefined') {
      const currentName = locEnv.trueName[locEnv.requireLevel];
      const nameToShow = target[name+endName];
      onModuleControl(locEnv.accessMatrix[currentName], nameToShow, 'R');
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
      onModuleControl(locEnv.accessMatrix[currentName], nameToStore, 'W');

      return result;
    }

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
  get: function(target, name) {
    const currentName = locEnv.trueName[locEnv.requireLevel];
    onModuleControl(locEnv.accessMatrix[currentName], target.name, 'R');

    return Reflect.get(target, name);
  },
};

// The handler of the imported libraries
const handlerExports= {
  apply: function(target, thisArg, argumentsList) {
    let truename;

    truename = locEnv.objName.get(target);
    const currentName = locEnv.objPath.get(target);
    truename = truename + '.' + target.name;
    //TODO: fix the currentName
    return exportFuncControl(locEnv.accessMatrix[currentName], truename, arguments);
  },
};

// We update the instance of require
const updateCounter = (counter) => {
  locEnv.requireLevel = counter;
}

// Read function so we print it in the export file
// This is to catch the read
const readFunction = (myFunc, name) => {
  name = name + '.' + myFunc.name;
  const currentPlace = locEnv.trueName[locEnv.requireLevel];
  let storedCalls = locEnv.accessMatrix[currentPlace];

  if (Object.prototype.hasOwnProperty.
        call(storedCalls, name) === false) {
    storedCalls[name] = 'R';
  } else {
    addEvent('R', storedCalls, name);
  }
}

module.exports = (env) => {
	locEnv = env;
	return {
		require : RequireRWE,
		exportControl : exportControl,
		exportFuncControl : exportFuncControl,
		onModuleControlFunc : onModuleControlFunc,
		onModuleControl : onModuleControl,
    handler : handler,
    handlerGlobal : handlerGlobal,
    handlerExports : handlerExports,
    updateCounter : updateCounter,
    readFunction : readFunction,
	}
};
