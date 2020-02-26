/* eslint prefer-rest-params: "off", no-global-assign: "off",
no-shadow-restricted-names: "off" */

// We use this global value to know if the program has ended or not
// necessary for enforcement analysis(5, 7) 
global.end= false;

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

// WeakMaps to store the name and the path for every object value
const objName = new WeakMap();
const objPath = new WeakMap();

// @globals.json contains all the functions we want to wrap in a proxy
// @staticGlobals.json contains all the global variables that contain static functions
// @constantGlobals.json has all the constants of the static variables 
// We read and store the data of the json file
const globals = require('./globals.json');
const sglobals = require('./staticGlobals.json');
const cglobals = require('./constantGlobals.json');
// const jsonPrototypeData = require('./prototypeGlobals.json');

// We make a test on fragment
const env = {
  trueName : trueName,
  requireLevel : requireLevel,
  accessMatrix: accessMatrix,
  objName : objName,
  objPath : objPath,
};

// We return the choice of the user
// 1) True - False Analysis
// 2) Times calling a function
// 3) Time Analysis
// 4) Time Analysis2.0
// 5) Enforcement Analysis
// 6) RWE Analysis
// 7) RWE Enforcement
// 8) Global Object Analysis
// 9) TypeOf Export Object Analysis
let userChoice = (lyaConfig.analysisCh && [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].includes(lyaConfig.analysisCh))? lyaConfig.analysisCh : 1
console.log(lyaConfig.analysisCh)
// You import the right policy depenting on the choice
// of the user.
let policy = require('./policy' + userChoice + '.js')(env);;

// We wrap the global variable in a proxy
global = new Proxy(global, policy.globalHandler);

// A proxy to use it in Math.PI etc
globalProxies['proxyExportHandler'] = policy.globalConstHandler;


// Case handler
// Returns the right require handler for the case
const mainRequire = (original) => {
  return new Proxy(original, policy.require);
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
    globalProxies[name] = proxyWrap(policy.moduleHandler, global[name]);
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
    globalProxies[nameToShow] = proxyWrap(policy.moduleHandler, global[upValue][name]);
    // We save the declared wraped functions in new local
    finalDecl += nameToShow + ' = pr["' + nameToShow +'"];\n';
    // And we change the name to a better one
    finalDecl += 'Object.defineProperty(' + upValue + '.' +
      name + ',"name", {value:"' + nameToShow + '"});\n';
  }

  return finalDecl;
};

// We cant wrap it in a proxy cause they are numbers -- Math.PI
const createConstantGlobal = (name, finalDecl, upValue) => {
  if (global[upValue][name] != undefined) {
    const nameToShow = upValue + '.' + name;
    globalProxies[nameToShow] =  global[upValue][name];
    // We save the declared wraped functions in new local
    finalDecl += nameToShow + ' = pr["' + nameToShow +'"];\n';
    finalDecl += nameToShow + name + ' = "' + nameToShow + '";\n';
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

  // This is for the constant global Data --Math.PI, Math.LOG2E etc
  for (const upValue in cglobals) {
    if (Object.prototype.hasOwnProperty.call(cglobals, upValue)) {
      const globalVariables = cglobals[upValue];
      for (const declName in globalVariables) {
        if (Object.prototype.hasOwnProperty.call(globalVariables, declName)) {
          const name = globalVariables[declName];
          finalDecl = createConstantGlobal(name, finalDecl, upValue);
        }
      }
    }
    finalDecl += upValue + ' = new Proxy(' + upValue + ', pr["proxyExportHandler"]);\n';  

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

// The first time this runs we create the decl
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
  env.requireLevel++;
  trueName[env.requireLevel] = getName(options['filename']);
  // Should move to policies
  if (!Object.prototype.hasOwnProperty.
    call(accessMatrix,trueName[env.requireLevel])){
    accessMatrix[trueName[env.requireLevel]] = {};
  }
  return new Proxy(codeToRun, handlerAddArg);
};

// We wrap the result in the wrapper function
Module.prototype.require = function(...args) {
  const path = args[0];
  let result = originalRequire.apply(this, args);
  // If false that means that we pass from here for the 
  // first time.
  const type = typeof result;
  if (type != 'boolean' && type != 'symbol' && type != 'number' && type != 'string') {
    if ( objName.has(result) === false ) {
      // Each time we update env we update locEnv too
      objName.set(result, 'require(\'' + path + '\')');
      objPath.set(result, trueName[env.requireLevel]);
      result = new Proxy(result, exportHandler);
      if (env.requireLevel !=0){
        env.requireLevel--;
      }
    } else {
      result = new Proxy(result, exportHandler);
      objName.set(result, 'require(\'' + path + '\')');
      objPath.set(result, trueName[env.requireLevel]);

    }
  }
  return result;
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

          let truepath = objPath.get(receiver);
          let truename = objName.get(receiver);
          if (truename === undefined) {
            truename = objName.get(target);
          }
          if (truepath === undefined) {
            truepath = objPath.get(target);
          } 
          const localObject = target[name];

          target[name] = new Proxy(target[name], exportHandler);
          objName.set(localObject, truename + '.' + name);
          objPath.set(localObject, truepath);

          result = Reflect.get(target, name);
          m1.set(result, true);

          return result; 
        }
      } else if (type === 'function') {
        // We first return the obj to check that is not wraped in a proxy
        let localFunction = target[name];
        if (!m1.has(target[name])){
          Object.defineProperty(localFunction, 'name', {value: name});
          target[name] = new Proxy(localFunction, policy.exportsFuncHandler);
        }
          
        objPath.set(localFunction, trueName[env.requireLevel]);
        objName.set(localFunction, objName.get(target));
          
        // Undefined fix
        policy.readFunction(localFunction, objName.get(target));

        result = Reflect.get(target, name);
        m1.set(result, true);
        return result;
      }
    }

    return Reflect.get(target, name);
  },
};

// We print all the results on the end of the program only if we dont
// use it for enforcement analysis(5, 7) cause we dont want to
// print anything.
process.on('exit', function() {
  global.end = true;
  if (lyaConfig.SAVE_RESULTS && userChoice != 5 && userChoice != 7) {
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
