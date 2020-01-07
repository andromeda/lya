// env is {
//   trueName : trueName,
//   requireLevel : requireLevel,
//   accessMatrix: accessMatrix,
// }
let locEnv;

// Holds the end of each name store of new assigned global variables
// suffix for our own metadata
const endName = '@name';

// The nessasary modules
const path = require('path');

// We need to get the path of the main module in order to find dynamic json
const createDynamicObj = () => {
  // We save all the json data inside an object
  const appDir = path.join(path.dirname(require.main.filename), 'dynamic.json');
  let dynamicData;
  //console.log(lyaConfig.POLICY,'lala')
  try {
    dynamicData = require(lyaConfig.POLICY || appDir);
  } catch (e) {
    throw new Error('The dynamic.json file was not found!');
  }
  return dynamicData;
};

dynamicObj = createDynamicObj();

// @storedCalls it is a table that contains all the analysis data
// @truename the name of the current function, object etc that we want to add to
// the table 
// Given those two inputs we can update the analysis data that are stored in storedCalls
const updateAnalysisData = (storedCalls, truename) => {
  if (Object.prototype.hasOwnProperty.call(storedCalls, truename) === false) {
      throw new Error('Something went badly wrong in ' + truename);
    }
}

// The handler of require of Enforcement
const EnforcementCheck = {
  apply: function(target) {
    const currentName = locEnv.trueName[locEnv.requireLevel];
    const nameReq = target.name + '(\'' + arguments[2][0] +// In arguments[2][0]
      '\')';// Is the name we use to import
    if (Object.prototype.hasOwnProperty.
        call(dynamicObj, currentName, nameReq) === false) {
      throw new Error('Something went badly wrong on the require!');
    }

    return Reflect.apply( ...arguments);
  },
};

// The handler of the global variable.Every time we access the global variabe in order to declare 
// or call a variable, then we can print it on the export file.
const globalHandler = {
  get: function(target, name) {
    // XXX[target] != 'undefined'
    if (typeof target[name+endName] != 'undefined') {
      const currentName = locEnv.trueName[locEnv.requireLevel];
      const nameToShow = target[name+endName];
      updateAnalysisData(dynamicObj[currentName], nameToShow);
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
      updateAnalysisData(dynamicObj[currentName], nameToStore);

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
    updateAnalysisData(dynamicObj[currentName], target.name);

    return Reflect.apply(...arguments);
  },
  get: function(target, name) {
    const currentName = locEnv.trueName[locEnv.requireLevel];
    updateAnalysisData(dynamicObj[currentName], target.name);

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
    const currentName = locEnv.objPath.get(target);
    truename = truename + '.' + target.name;
    updateAnalysisData(dynamicObj[currentName], truename);

    return Reflect.apply(...arguments);
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
  let storedCalls = dynamicObj[currentPlace];

  if (Object.prototype.hasOwnProperty.
        call(storedCalls, name) === false) {
      throw new Error('Something went badly wrong in ' + name);
  }
}

// This is the handler of the export object. Every time we require a module, and it has
// export data we wrap those data in this handler. So this is the first layer of the 
// export data wraping. 
const exportHandler = {
  get: function(target, name, receiver) {
    const type = typeof target[name];
    if (type != 'undefined' && type === 'string') { // + udnefined
      // If we try to grab an object we wrap it in this proxy
      if (type === 'object') {

        let truepath = locEnv.objPath.get(receiver);
        let truename = locEnv.objName.get(receiver);
        if (truename === undefined) {
          truename = locEnv.objName.get(target);
        }
        if (truepath === undefined) {
          truepath = locEnv.objPath.get(target);
        }
        const localObject = target[name];
        target[name] = new Proxy(localObject, exportHandler);
        locEnv.objName.set(localObject, truename + '.' + name);
        locEnv.objPath.set(localObject, truepath);
      }  else if (type === 'function') {
        const localFunction = target[name];

        Object.defineProperty(localFunction, 'name', {value: name});
        target[name] = new Proxy(localFunction, exportsFuncHandler);
        locEnv.objPath.set(localFunction, locEnv.trueName[locEnv.requireLevel]);
        locEnv.objName.set(localFunction, locEnv.objName.get(target));

      }
    }

    return Reflect.get(target, name);
  },
};

// This is the handler of the global constanst variables, like Math.PI etc. We store the name 
// in the same object but we use a different name, for example, for Math.PI we store the 
// name "Math.PI" in the object Math.PIPI. That way we can have accurate name analysis.
const globalConstHandler = {
  get: function(target, name) {
    const currentName = locEnv.trueName[locEnv.requireLevel];
    updateAnalysisData(dynamicObj[currentName], target[name+name]);

    return Reflect.get(target, name);
  },
};

module.exports = (env) => {
	locEnv = env;
	return {
		require : EnforcementCheck,
    moduleHandler : moduleHandler,
    globalHandler : globalHandler,
    updateCounter : updateCounter,
    exportHandler : exportHandler,
    globalConstHandler : globalConstHandler,
    objNameSet : (result, path) => {
      locEnv.objName.set(result, 'require(\'' + path + '\')');
    },
    objPathSet : (result) => {
      locEnv.objPath.set(result, locEnv.trueName[locEnv.requireLevel]);
    },
	}
};