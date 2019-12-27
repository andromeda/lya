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
const EnforcementCheck= {
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

const exportControl = (storedCalls, truename) => {
  if ((Object.prototype.hasOwnProperty.call(storedCalls, truename) === false ||
    problemCheck(storedCalls[truename],'R')) && !global.end) {
      throw new Error('Something went badly wrong in ' + truename);
    }
}

const exportFuncControl = (storedCalls, truename, arguments) => {
  if ((Object.prototype.hasOwnProperty.call(storedCalls, truename) === false ||
    problemCheck(storedCalls[truename],'E')) && !global.end) {
      throw new Error('Something went badly wrong in ' + truename);
    }

    return Reflect.apply(...arguments);
}

const onModuleControlFunc = (storedCalls, truename, arguments) => {
  if ((Object.prototype.hasOwnProperty.call(storedCalls, truename) === false ||
    problemCheck(storedCalls[truename],'E')) && !global.end) {
      throw new Error('Something went badly wrong!');
    }

    return Reflect.apply(...arguments);
}

const onModuleControl = (storedCalls, truename, mode) => {
  if ((Object.prototype.hasOwnProperty.call(storedCalls, truename) === false ||
    problemCheck(storedCalls[truename], mode)) && !global.end) {
      throw new Error('Something went badly wrong in ' + truename);
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
      onModuleControl(dynamicObj[currentName], nameToShow, 'R');
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
      onModuleControl(dynamicObj[currentName], nameToStore, 'W');

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

    return onModuleControlFunc(dynamicObj[currentName],
          target.name, arguments);
  },
  get: function(target, name) {
    const currentName = locEnv.trueName[locEnv.requireLevel];
    onModuleControl(dynamicObj[currentName], target.name, 'R');

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

    return exportFuncControl(dynamicObj[currentName],
          truename, arguments);
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

  if ((Object.prototype.hasOwnProperty.
        call(storedCalls, name) === false ||
          problemCheck(storedCalls[name], 'R')) && !global.end) {
      throw new Error('Something went badly wrong in ' + name);
  }
};

const handlerObjExport= {
  get: function(target, name, receiver) {
    if (typeof target[name] != 'undefined' && typeof name === 'string') { // + udnefined
      // If we try to grab an object we wrap it in this proxy
      if (typeof target[name] === 'object') {

        let truepath = locEnv.objPath.get(receiver);
        let truename = locEnv.objName.get(receiver);
        if (truename === undefined) {
          truename = locEnv.objName.get(target);
        }
        if (truepath === undefined) {
          truepath = locEnv.objPath.get(target);
        }
        const localObject = target[name];
        target[name] = new Proxy(localObject, handlerObjExport);
        locEnv.objName.set(localObject, truename + '.' + name);
        locEnv.objPath.set(localObject, truepath);

      } else if (typeof target[name] === 'function') {
        const localFunction = target[name];

        Object.defineProperty(localFunction, 'name', {value: name});
        target[name] = new Proxy(localFunction, handlerExports);
        locEnv.objPath.set(localFunction, locEnv.trueName[locEnv.requireLevel]);
        locEnv.objName.set(localFunction, locEnv.objName.get(target));
      }
    }

    return Reflect.get(target, name);
  },
};


module.exports = (env) => {
  locEnv = env;
  return {
    require : EnforcementCheck,
    exportControl : exportControl,
    exportFuncControl : exportFuncControl,
    onModuleControlFunc : onModuleControlFunc,
    onModuleControl : onModuleControl,
    handler : handler,
    handlerGlobal : handlerGlobal,
    handlerExports : handlerExports,
    updateCounter : updateCounter,
    readFunction : readFunction,
    handlerObjExport : handlerObjExport,
    objNameSet : (result, path) => {
      locEnv.objName.set(result, 'require(\'' + path + '\')');
    },
    objPathSet : (result) => {
      locEnv.objPath.set(result, locEnv.trueName[locEnv.requireLevel]);
    },
  }
};
