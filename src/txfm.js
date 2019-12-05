/* eslint prefer-rest-params: "off", no-global-assign: "off" */
// We import and declare all the necessary modules
const Module = require('module');
const vm = require('vm');
const fs = require('fs');

// All the necessary modules for swap
const originalWrap = Module.wrap;
const originalRequire = Module.prototype.require;
const originalRun = vm.runInThisContext;

// We declare the variables
const globalProxy = {};
const variableCall = {};

// We store names as a lifo
const trueName = {};
let count = 0;

// Holds the end of each name store of new assigned global variables
const endName = '@name';

// This holds the string of the transformations inside modules
let finalDecl = ' ';

// Handlers of Proxies

// The handler of the functions
const handler= {
  apply: function(target) {
    const currentName = trueName[count];
    if (Object.prototype.hasOwnProperty.
        call(variableCall[currentName], target.name) === false) {
      variableCall[currentName][target.name] = true;
    }

    return Reflect.apply(...arguments);
  },
  get: function(target, name) {
    const currentName = trueName[count];
    if (Object.prototype.hasOwnProperty.
        call(variableCall[currentName], target.name) === false) {
      variableCall[currentName][target.name] = true;
    }

    return Reflect.get(target, name);
  },
};

// The handler of the global variable
// Every time we access the global variabe in order to declare or call
// a variable, then we can print it on the export file. It doesnt work
// if it isn't called like global.xx
const handlerGlobal= {
  get: function(target, name) {
    if (typeof target[name+endName] != 'undefined') {
      const currentName = trueName[count];
      const nameToShow = target[name+endName];
      if (Object.prototype.hasOwnProperty.
          call(variableCall[currentName], nameToShow) === false) {
        variableCall[currentName][nameToShow] = true;
      }
    }
    return Reflect.get(target, name);
  },
  set: function(target, name, value) {
    if (typeof value === 'number') {
      const currentName = trueName[count];
      const nameToStore = 'global.' + name;
      const result = Reflect.set(target, name, value);
      // In order to exist a disticton between the values we declared ourselfs
      // We declare one more field with key value that stores the name
      Object.defineProperty(target, name+endName, {value: nameToStore});
      if (Object.prototype.hasOwnProperty.
          call(variableCall[currentName], nameToStore) === false) {
        variableCall[currentName][nameToStore] = true;
      }
      return result;
    }
    return Reflect.set(target, name, value);
  },
};

// The handler of the imported libraries
const handlerExports= {
  apply: function(target) {
    const currentName = arguments[1].truepath;
    let truename = arguments[1].truename;
    truename = truename + '.' + target.name;
    if (Object.prototype.hasOwnProperty.
        call(variableCall[currentName], truename) === false) {
      variableCall[currentName][truename] = true;
    }

    return Reflect.apply( ...arguments);
  },
};

// The handler of require --we need to import the name
const handlerRequire= {
  apply: function(target) {
    const currentName = trueName[count];
    const nameReq = target.name + '(\'' + arguments[2][0] +// In arguments[2][0]
      '\')';// Is the name we use to import
    variableCall[currentName][nameReq] = true;

    return Reflect.apply( ...arguments);
  },
};

// The handler of compiledWrapper
// We wrap the compiledWrapper code in a proxy so
// when it is called it will do this actions =>
const handlerAddArg= {
  apply: function(target) {
    // We catch local require in order to wrap it
    let localRequire = arguments[2][1];
    localRequire = new Proxy(localRequire, handlerRequire);
    arguments[2][1] = localRequire;// We wrap require
    arguments[2][5] = globalProxy;// We pass the global values with the proxies
    const result = Reflect.apply( ...arguments);

    return result;
  },
};

// We first wrap the export obj so that we avoid to
// print functions that are not called by us
const handlerObjExport= {
  get: function(target, name) {
    if (typeof target[name] != 'undefined') {
      // If we try to grab an object we wrap it in this proxy
      if (typeof target[name] === 'object') {
        const localObject = target[name];
        target[name] = new Proxy(localObject, handlerObjExport);
        target[name].truename = target['truename'] + '.' +
          name;// And update truename

        target[name].truepath = target['truepath'];
        // If we try to call a string that is not truename or truepath
        // We take the path that we are by using true_count
        // We need to print access to that variable
      } else if (typeof target[name] === 'string') {
        if (name != 'truename' && name != 'truepath') {
          const truepath = trueName[count];
          let truename = target.truename;
          truename = truename + '.' + name;
          if (variableCall[truepath] === 'undefined') {
            variableCall[truepath] = {};
            variableCall[truepath][truename] = true;
          } else {
            variableCall[truepath][truename] = true;
          }
        }
      } else {
        const localFunction = target[name];
        // We rename the function to the true name
        // This fixes the name problem
        Object.defineProperty(localFunction, 'name', {value: name});
        target[name] = new Proxy(localFunction, handlerExports);
      }
    }

    return Reflect.get(target, name);
  },
};

// Returns the proxy obj we want
const proxyWrap = function(handler, obj) {
  if (typeof obj === 'function') {
    obj = new Proxy(obj, handler);
    return obj;
  }

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const type = typeof obj[key];
      if (type === 'number' || type === 'boolean' ) {
        console.log('Do nothing');
      } else if (type === 'object') {
        obj[key] = proxyWrap(obj[key]);
      } else {
        obj[key] = new Proxy(obj[key], handler);
      }
    }
  }

  return obj;
};

// We read and store the data of the json file
const jsonData = require('./globals.json');
const jsonStaticData = require('./staticGlobals.json');
// const jsonPrototypeData = require('./prototypeGlobals.json');

// We declare the data on the same time to pass them inside wrapped function
const createGlobal = (name, finalDecl) => {
  if (global[name] != undefined) {
    globalProxy[name] = proxyWrap(handler, global[name]);
    finalDecl = 'let ' + name + ' = pr.' + name +';\n' + finalDecl;
  }

  return finalDecl;
};

// We use it to pass the static global data inside module
const createStaticGlobal = (name, finalDecl, upValue) => {
  if (global[upValue][name] != undefined) {
    const finalName = upValue + name;
    const nameToShow = upValue + '.' + name;
    globalProxy[finalName] = proxyWrap(handler, global[upValue][name]);
    // We save the declared wraped functions in new local
    finalDecl = finalDecl + upValue + '.' + name + ' = pr.' + finalName +';\n';
    // And we change the name to a better one
    finalDecl = finalDecl + 'Object.defineProperty(' + upValue + '.' +
      name + ',"name", {value:"' + nameToShow + '"});\n';
  }

  return finalDecl;
};

// // We use it to pass the static global data inside module
// const createPrototypeGlobal = (name, finalDecl, upValue) => {
//   if (global[upValue][name] != undefined) {
//     const finalName = upValue + name + 'prototype';
//     const passName = '.prototype.' + name;
//     const nameToShow = upValue + passName;
//     globalProxy[finalName] = proxyWrap(handler,
//         global[upValue]['prototype'][name]);
//     // We save the declared wraped functions in new local
//     finalDecl = finalDecl + upValue + passName + ' = pr.' + finalName +';\n';
//     // And we change the name to a better one
//     finalDecl = finalDecl + 'Object.defineProperty(' + upValue +
//       passName + ',"name", {value:"' + nameToShow + '"});\n';
//   }
//   return finalDecl;
// };

// We need to add all the global prototype variable declarations in the script
const createFinalDecl = () => {
  // This is for the static global Data --Math,JSON etc
  for (const upValue in jsonStaticData) {
    if (Object.prototype.hasOwnProperty.call(jsonStaticData, upValue)) {
      const globalVariables = jsonStaticData[upValue];
      finalDecl = 'let ' + upValue + ' = {};\n' + finalDecl;
      for (const declName in globalVariables) {
        if (Object.prototype.hasOwnProperty.call(jsonStaticData, upValue)) {
          const name = globalVariables[declName];
          finalDecl = createStaticGlobal(name, finalDecl, upValue);
        }
      }
    }
  }

// This is for the static global Data --Math,JSON etc
// for (const upValue in jsonPrototypeData) {
//  if (Object.prototype.hasOwnProperty.call(jsonPrototypeData, upValue)) {
//    const globalVariables = jsonPrototypeData[upValue];
//    for (const declName in globalVariables) {
//      if (Object.prototype.hasOwnProperty.call(jsonPrototypeData, upValue)) {
//        const name = globalVariables[declName];
//        finalDecl = createPrototypeGlobal(name, finalDecl, upValue);
//       }
//     }
//   }
// }

  for (const upValue in jsonData) {
    if (Object.prototype.hasOwnProperty.call(jsonData, upValue)) {
      const globalVariables = jsonData[upValue];
      for (const declName in globalVariables) {
        if (Object.prototype.hasOwnProperty.call(jsonData, upValue)) {
          const name = globalVariables[declName];
          finalDecl = createGlobal(name, finalDecl);
        }
      }
    }
  }

  return finalDecl;
};

const globalsDecl = () => {
  if (finalDecl === ' ') {
    return createFinalDecl();
  } else {
    return finalDecl;
  }
};

// We do some stuff and then call original warp
Module.wrap = (script) => {
  script = globalsDecl() + script;
  let wrappedScript = originalWrap(script);
  wrappedScript = wrappedScript.replace('__dirname)', '__dirname, pr)');
  return wrappedScript;
};

// Returns the last location of a path
const getName = (wayFile) => {
  const splited = wayFile.split('/');
  return splited[splited.length - 1];
};

// We export the name of the curr module and pass proxy to the final function
vm.runInThisContext = function(code, options) {
  const codeToRun = originalRun(code, options);
  count++;
  trueName[count] = getName(options['filename']);
  variableCall[trueName[count]] = {};
  return new Proxy(codeToRun, handlerAddArg);
};

// We wrap the result in the wrapper function
Module.prototype.require = (path) => {
  let result = originalRequire(path, this);
  if (result.truename === undefined ) {
    result = new Proxy(result, handlerObjExport);
    result.truename = 'require(\'' + path + '\')';
    result.truepath = trueName[count];
    if (count !=0) count--;
  } else {
    result = new Proxy(result, handlerObjExport);
    result.truename = 'require(\'' + path + '\')';
    result.truepath = trueName[count];
  }
  return result;
};

// We return the choice of the user
// 1) True - False Analysis
// 2) Times calling a function
const analysisChoice = () => {
  let choice;
  try {
    choice = global.analysisCh;
  } catch (ReferenceError) {
    choice = 1;
  }

  if (choice != (1 && 2)) {
    return 1;
  }
  return choice;
};
const userChoice = analysisChoice();
console.log(userChoice);

// We export the require for the main function
const expRequire = new Proxy(require, handlerRequire);
trueName[0] = 'main';
variableCall[trueName[0]] = {};
module.exports = expRequire;

// We wrap the global variable in a proxy
global = new Proxy(global, handlerGlobal);

// We print all the results on the end of the program
expRequire.RESULTS = variableCall;
process.on('exit', function() {
  if (expRequire.SAVE_RESULTS) {
    fs.writeFileSync(expRequire.SAVE_RESULTS,
        JSON.stringify(variableCall, null, 2), 'utf-8');
  } else {
    console.log(JSON.stringify(variableCall));
  }
});
