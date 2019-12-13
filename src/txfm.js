/* eslint prefer-rest-params: "off", no-global-assign: "off",
no-shadow-restricted-names: "off" */
//let lyaConfig= {};

// We import and declare all the necessary modules
const Module = require('module');
const vm = require('vm');
const fs = require('fs');

// All the necessary modules for swap
const originalWrap = Module.wrap;
const originalRequire = Module.prototype.require;
const originalRun = vm.runInThisContext;

// `require` name stack / tree 
// require( ...require('..')... )
// main: 0;
// m1: 1;
// m2: 2;
const trueName = [];
let requireLevel = 0;
const globalProxies = {};
const accessMatrix = {};

trueName[0] = 'main';
accessMatrix[trueName[0]] = {};

// Holds the end of each name store of new assigned global variables
// suffix for our own metadata
const endName = '@name';

// This holds the string of the transformations inside modules
let finalDecl = ' ';

// Array to store the time of the modules
const timeCapsule = {};

// WeakMaps to store the name and the path for every object value
const objName = new WeakMap();
const objPath = new WeakMap();

// We read and store the data of the json file
const globals = require('./globals.json');
const sglobals = require('./staticGlobals.json');
// const jsonPrototypeData = require('./prototypeGlobals.json');

// We make a test on fragment
const env = {
  trueName : trueName,
  requireLevel : requireLevel,
  accessMatrix: accessMatrix,
  timeCapsule : timeCapsule,
  objName : objName,
  objPath : objPath,
};

// We return the choice of the user
// 1) True - False Analysis
// 2) Times calling a function
// 3) Time Analysis
// 4) Time Analysis2.0
// 5) Enforcement Analysis
let userChoice = (lyaConfig.analysisCh && [1, 2, 3, 4, 5].includes(lyaConfig.analysisCh))? lyaConfig.analysisCh : 1

// You import the right policy depenting on the choice
// of the user.
const importPolicy = (choice) => {
  if (choice === 1) {
    return require('./policy1.js')(env);
  } else if (choice === 2) {
    return require('./policy2.js')(env);
  } else if (choice === 3) {
    return require('./policy3.js')(env);
  } else if (choice === 4) {
    return require('./policy4.js')(env);
  } else if (choice === 5) {
    return require('./policy5.js')(env);
  }// You can add here as many policies as you want
}
let policy = importPolicy(userChoice);

// We wrap the global variable in a proxy
global = new Proxy(global, policy.handlerGlobal);

// Case handler
// Returns the right require handler for the case
const mainRequire = (original) => {
  return new Proxy(original, policy.require);
};

// We incriment and declare the ness things
// This is for the handlerObjExport
const exportControl = (storedCalls, truename) => {
  if (userChoice === 1) {// Case 1 - True False
    policy.exportControl(storedCalls, truename);
  } else if (userChoice === 2) {// Case 2 - Counter
    policy.exportControl(storedCalls, truename);
  } else if (userChoice === 5) {// Case 5 - Enforcement
    policy.exportControl(storedCalls, truename);
  }
};

// We incriment and declare the ness things
// This is for handlerExports
const exportFuncControl = (storedCalls, truename, arguments) => {
  return policy.exportFuncControl(storedCalls, truename, arguments);
};

// The handler of compiledWrapper
// We wrap the compiledWrapper code in a proxy so
// when it is called it will do this actions =>
const handlerAddArg= {
  apply: function(target, thisArg, argumentsList) {
    // We catch local require in order to wrap it
    let localRequire = argumentsList[1];
    localRequire = mainRequire(localRequire);
    argumentsList[1] = localRequire;// We wrap require
    argumentsList[5] = globalProxies;// We pass the global values with the proxies

    return Reflect.apply( ...arguments);
  },
};

// We first wrap the export obj so that we avoid to
// print functions that are not called by us
//
// require('fs);
// fs.openSync(pizza);
// fs.read(katiAllo);
//
// fs.read () => {... fs.resolve(...) ... return...}
const handlerObjExport= {
  get: function(target, name, receiver) {
    if (typeof target[name] != 'undefined') { // + udnefined
      // If we try to grab an object we wrap it in this proxy
      if (typeof target[name] === 'object') {
       // FIXME
        let truepath = objPath.get(receiver);
        let truename = objName.get(receiver);
        if (truepath === undefined) {
          truepath = objPath.get(target);
          truename = objName.get(target);
        }

        const localObject = target[name];
        target[name] = new Proxy(localObject, handlerObjExport);

        objName.set(target[name], truename + '.' + name);
        objPath.set(target[name], truepath);

        // If we try to call a string that is not truename or truepath
        // We take the path that we are by using true_count
        // We need to print access to that variable
      } else if (typeof target[name] === 'string') {
        if (name != 'truename' && name != 'truepath') {
          let truepath = objPath.get(receiver);
          let truename = objName.get(receiver);
          if (truepath === undefined) {
            truepath = objPath.get(target);
            truename = objName.get(target);
          }

          truename = truename + '.' + name;
          if (userChoice === 5) {
            exportControl(dynamicObj[trueName[requireLevel]], truename);
          } else {
            exportControl(accessMatrix[trueName[requireLevel]], truename);
          }
        }
      } else {
        const localFunction = target[name];
        const type = typeof localFunction;
        if (type != 'number' && type != 'boolean' &&
         type != 'symbol') {
          Object.defineProperty(localFunction, 'name', {value: name});
          target[name] = new Proxy(localFunction, policy.handlerExports);
          objPath.set(localFunction, trueName[requireLevel]);
          objName.set(localFunction, objName.get(target));
        }
      }
    }

    return Reflect.get(target, name);
  },
};

// We wrap every function on global obj that exists in globals.json
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

// We declare the data on the same time to pass them inside wrapped function
const createGlobal = (name, finalDecl) => {
  if (global[name] != undefined) {
    globalProxies[name] = proxyWrap(policy.handler, global[name]);
    finalDecl = 'let ' + name + ' = pr.' + name +';\n' + finalDecl;
  }

  return finalDecl;
};

// We use it to pass the static global data inside module
// FIXME: name injectGlobal?
// FIXME: give example here
const createStaticGlobal = (name, finalDecl, upValue) => {
  if (global[upValue][name] != undefined) {
    const nameToShow = upValue + '.' + name;
    globalProxies[nameToShow] = proxyWrap(policy.handler, global[upValue][name]);
    // We save the declared wraped functions in new local
    finalDecl += nameToShow + ' = pr["' + nameToShow +'"];\n';
    // And we change the name to a better one
    finalDecl += 'Object.defineProperty(' + upValue + '.' +
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
//     globalProxies[finalName] = proxyWrap(handler,
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
  for (const upValue in sglobals) {
    if (Object.prototype.hasOwnProperty.call(sglobals, upValue)) {
      const globalVariables = sglobals[upValue];
      finalDecl = 'let ' + upValue + ' = {};\n' + finalDecl;
      for (const declName in globalVariables) {
        if (Object.prototype.hasOwnProperty.call(globalVariables, declName)) {
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
  //    if (Object.prototype.hasOwnProperty.call(jsonPrototypeData, upValue)) {
  //        const name = globalVariables[declName];
  //        finalDecl = createPrototypeGlobal(name, finalDecl, upValue);
  //       }
  //     }
  //   }
  // }

  for (const upValue in globals) {
    if (Object.prototype.hasOwnProperty.call(globals, upValue)) {
      const globalVariables = globals[upValue];
      for (const declName in globalVariables) {
        if (Object.prototype.hasOwnProperty.call(globalVariables, declName)) {
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
    userRemoves();
    return createFinalDecl();
  } else {
    return finalDecl;
  }
};

// User can remove things from json file that create conf
const userRemoves = () => {
  const list = lyaConfig.removejson;
  if (list != undefined) {
    for (let i = 0; i < list.length; i++) {
      const value = list[i];
      for (const upValue in globals) {
        if (Object.prototype.hasOwnProperty.call(globals, upValue)) {
          if (upValue === value) {
            globals.remove(upValue);
          }
          const globalVariables = globals[upValue];
          for (const declName in globalVariables) {
            if (Object.prototype.hasOwnProperty.
                call(globalVariables, declName)) {
              const name = globalVariables[declName];
              if (name === value) {
                delete globalVariables[declName];
              }
            }
          }
        }
      }
    }
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
  requireLevel++;
  policy.updateCounter(requireLevel);
  //policy.requireLevel++;
  trueName[requireLevel] = getName(options['filename']);
  accessMatrix[trueName[requireLevel]] = {};
  return new Proxy(codeToRun, handlerAddArg);
};

// We wrap the result in the wrapper function
Module.prototype.require = function(...args) {
  const path = args[0];
  let result = originalRequire.apply(this, args);
  if ( objName.has(result) === false ) {
    objName.set(result, 'require(\'' + path + '\')');
    objPath.set(result, trueName[requireLevel]);
    result = new Proxy(result, handlerObjExport);
    if (requireLevel !=0){
      requireLevel--;
      policy.updateCounter(requireLevel);
    }
    //if (policy.requireLevel !=0) policy.requireLevel--;
  } else {
    result = new Proxy(result, handlerObjExport);
    objName.set(result, 'require(\'' + path + '\')');
    objPath.set(result, trueName[requireLevel]);
  }
  return result;
};

// We print all the results on the end of the program
process.on('exit', function() {
  if (lyaConfig.SAVE_RESULTS && userChoice != 5 ) {
    fs.writeFileSync(lyaConfig.SAVE_RESULTS,
        JSON.stringify(accessMatrix, null, 2), 'utf-8');
  }
});

module.exports = {
  configRequire: (origRequire, origConfig) => {
    lyaConfig = origConfig;
    return mainRequire(origRequire);
  },
};
