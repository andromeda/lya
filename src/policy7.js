// TODO: Find a more elegant solution than !global.end
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
  try {
    dynamicData = require(lyaConfig.POLICY || appDir);
  } catch (e) {
    throw new Error('The dynamic.json file was not found!');
  }
  return dynamicData;
};

dynamicObj = createDynamicObj();

// Check that the line of dynamic.json contains the right char 
// for the occasion ==> false / else true
const problemCheck = (line, char) => {
  try {
    if (line.includes(char)) {
      return false;
    } else {
      return true;
    }
  } catch (e) {
    new Error('Good problem!');
  }
};

// The handler of require of Enforcement
const EnforcementCheck = {
  apply: function(target) {
    const currentName = locEnv.trueName[locEnv.requireLevel];
    const nameReq = target.name + '(\'' + arguments[2][0] +// In arguments[2][0]
      '\')';// Is the name we use to import
    //problemCheck(dynamicObj[currentName][nameReq])
    if ((Object.prototype.hasOwnProperty.
        call(dynamicObj, currentName, nameReq) === false ||
          problemCheck(dynamicObj[currentName][nameReq],'R')) && !global.end) {
      throw new Error('Something went badly wrong on the require!');
    }

    return Reflect.apply( ...arguments);
  },
};

// @storedCalls it is a table that contains all the analysis data
// @truename the name of the current function, object etc that we want to add to
// the table 
// @mode the mode of the current access (R,W or E)
// Given those two inputs we can update the analysis data that are stored in storedCalls
const CheckAnalysisData = (storedCalls, truename, mode) => {
  if ((Object.prototype.hasOwnProperty.call(storedCalls, truename) === false ||
    problemCheck(storedCalls[truename], mode)) && !global.end) {
      throw new Error('Something went badly wrong in ' + truename);
    }
};

// The handler of the global variable.Every time we access the global variabe in order to declare 
// or call a variable, then we can print it on the export file.
const globalHandler = {
  get: function(target, name) {
    // XXX[target] != 'undefined'
    if (typeof target[name+endName] != 'undefined') {
      const currentName = locEnv.trueName[locEnv.requireLevel];
      const nameToShow = target[name+endName];
      CheckAnalysisData(dynamicObj[currentName], nameToShow, 'R');
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
      CheckAnalysisData(dynamicObj[currentName], nameToStore, 'W');

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
    CheckAnalysisData(dynamicObj[currentName], target.name, 'E');

    return Reflect.apply(...arguments);
  },
  get: function(target, name) {
    const currentName = locEnv.trueName[locEnv.requireLevel];
    CheckAnalysisData(dynamicObj[currentName], target.name, 'R');

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
    CheckAnalysisData(dynamicObj[currentName], truename, 'E');

    return Reflect.apply(...arguments);
  },
};

// Read function so we print it in the export file
// This is to catch the read
const readFunction = (myFunc, name) => {
  name = name + '.' + myFunc.name;
  const currentPlace = locEnv.trueName[locEnv.requireLevel];
  let storedCalls = dynamicObj[currentPlace];

  if ((Object.prototype.hasOwnProperty.
        call(storedCalls, name) === false ||
          problemCheck(storedCalls[name], 'R')) && !global.end) {
      throw new Error('Something went badly wrong in ' + name);
  }
};

// This is the handler of the export object. Every time we require a module, and it has
// export data we wrap those data in this handler. So this is the first layer of the 
// export data wraping. 
const m1 = new WeakMap();
const exportHandler = {
  get: function(target, name, receiver) {
    const type = typeof target[name];
    if (type != 'undefined' && target[name] != null && typeof name === 'string' &&
        (!(target[name] instanceof RegExp))) { // + udnefined
      // If we try to grab an object we wrap it in this proxy
      if (type === 'object') {
        if ((!(Object.entries(target[name]).length === 0))) {
          // We first return the obj to check that is not wraped in a proxy
          if (m1.has(target[name])) {
            return Reflect.get(target, name);
          }

          let truepath = locEnv.objPath.get(receiver);
          let truename = locEnv.objName.get(receiver);
          if (truename === undefined) {
            truename = locEnv.objName.get(target);
          }
          if (truepath === undefined) {
            truepath = locEnv.objPath.get(target);
          } 
          const localObject = target[name];

          target[name] = new Proxy(target[name], exportHandler);
          locEnv.objName.set(localObject, truename + '.' + name);
          locEnv.objPath.set(localObject, truepath);

          result = Reflect.get(target, name);
          m1.set(result, true);

          return result; 
        }
      } else if (type === 'function') {
        // We first return the obj to check that is not wraped in a proxy
        let localFunction = target[name];
        if (!m1.has(target[name])){
          Object.defineProperty(localFunction, 'name', {value: name});
          target[name] = new Proxy(localFunction, exportsFuncHandler);
        }
          
        locEnv.objPath.set(localFunction, locEnv.trueName[locEnv.requireLevel]);
        locEnv.objName.set(localFunction, locEnv.objName.get(target));
          
        result = Reflect.get(target, name);
        m1.set(result, true);
        return result;
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
    CheckAnalysisData(dynamicObj[currentName], target[name+name], 'R');

    return Reflect.get(target, name);
  },
};

module.exports = (env) => {
  locEnv = env;
  return {
    require : EnforcementCheck,
    moduleHandler : moduleHandler,
    globalHandler : globalHandler,
    exportHandler : exportHandler,
    globalConstHandler : globalConstHandler,
  }
};
