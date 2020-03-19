/* eslint prefer-rest-params: "off", no-global-assign: "off",
no-shadow-restricted-names: "off" */

// TODO simple: use this rather than numbers.
// TODO later: replace numbers with configurable analysis paths, such that
//      users can optionally provide their own paths via the same config object.
const preset = {
  ALLOW_DENY: 1,
  CALL_NUMBERS: 2,
  PROFILING: 3,
  PROFILING_RELATIVE: 4,
  ALLOW_DENY_ENFORCEMENT: 5,
  RWX: 6,
  RWX_ENFORCEMENT: 7,
  GLOBAL_ONLY: 8,
  EXPORT_TYPE: 9,
  COARSE_TYPES: 10,
  SIMPLE_TYPES: 11,
  SUB_TYPES: 12
};

const nodeVersion = process.versions.node.split('.');
if (nodeVersion[0] !== 8 && nodeVersion[1] !== 9){
  console.error("Lya has been tested with Node v8.9.4, not " + process.version);
}

function lyaStartUp(lyaConfig, callerRequire) {

  // We use this global value to know if the program has ended or not
  // necessary for enforcement analysis(5, 7)
  // TODO: make this library local, like presets
  global.end = false;

  // We import and declare all the necessary modules
  const Module = require('module');
  const vm = require('vm');
  const fs = require('fs');

  // All the necessary modules for swap
  const originalWrap = Module.wrap;
  const originalRequire = Module.prototype.require;
  const originalRun = vm.runInThisContext;

  const trueName = [];
  let requireLevel = 0;
  const globalProxies = {};
  const accessMatrix = {};

  // TODO: fix main.js name -> find true name
  trueName[0] = process.cwd() + '/' + 'main.js';
  accessMatrix[trueName[0]] = {};

  // Holds the end of each name store of new assigned global variables
  // suffix for our own metadata
  const endName = '@name';

  // This holds the string of the transformations inside modules
  let finalDecl = ' ';

  // WeakMaps to store the name and the path for every object value
  const objName = new WeakMap();
  const objPath = new WeakMap();
  const methodNames = new WeakMap();
  const storePureFunctions = new WeakMap();
  const withProxy = new WeakMap();
  const globalNames = new Map();

  // @globals.json contains all the functions we want to wrap in a proxy
  // @staticGlobals.json contains all the global variables that contain static functions
  // @constantGlobals.json has all the constants of the static variables
  // We read and store the data of the json file
  const globals = require('./globals.json');
  const sglobals = require('./staticGlobals.json');
  const cglobals = require('./constantGlobals.json');
  const toSaveNames = require('./saveNames.json');

  // We make a test on fragment
  const env = {
    trueName : trueName,
    requireLevel : requireLevel,
    accessMatrix: accessMatrix,
    objName : objName,
    objPath : objPath,
    methodNames : methodNames,
    globalNames : globalNames
  };

  // We return the choice of the user
  // TODO: define a var currentAnalysis and use it everywhere
  let a = lyaConfig.analysis || preset.ALLOW_DENY;
  let userChoice = Object.keys(preset).map((e) => preset[e]).includes(a)? a : preset.ALLOW_DENY;

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

  // This function stores the names of the given object to
  // methodNames WeakMap ~> stores names of objs like console etc
  function generateNames(obj) {
    for (k in obj) {
      const functionNames = global[obj[k]];
      for (name in functionNames){
        if (typeof name === 'string' && name != undefined) {
          methodNames.set(functionNames[name], obj[k] + '.' + name);
        }
      }
    };
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
    } else if (typeof obj === 'object') {
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          const type = typeof obj[key];
          if (type === 'object') {
            obj[key] = proxyWrap(obj[key]);
          } else if (type != 'number' && type != 'boolean' ) {
            obj[key] = new Proxy(obj[key], handler);
          }
        }
      }
    }
    return obj;
  };

  const createGlobal = (name, finalDecl) => {
    if (global[name] != undefined) {
      globalProxies[name] = proxyWrap(policy.moduleHandler, global[name]);
      finalDecl = 'let ' + name + ' = pr["' + name +'"];\n' + finalDecl;
    }

    return finalDecl;
  };

  const createCSGlobal = (name, finalDecl, upValue, nameStore) => {
    if (global[upValue][name] != undefined) {
      const nameToShow = upValue + '.' + name;
      globalProxies[nameToShow] =  proxyWrap(policy.moduleHandler, global[upValue][name]);
      finalDecl += nameToShow + ' = pr["' + nameToShow +'"];\n';
      nameStore.set(global[upValue][name], nameToShow);

    }

    return finalDecl;
  };

  const passJSONFiles = (finalDecl, func, json, nameStore) => {
    for (const upValue in json) {
      if (Object.prototype.hasOwnProperty.call(json, upValue)) {
        const globalVariables = json[upValue];
        for (const declName in globalVariables) {
          if (Object.prototype.hasOwnProperty.call(globalVariables, declName)) {
            const name = globalVariables[declName];
            finalDecl = func(name, finalDecl, upValue, nameStore);
          }
        }
      }
    }

    return finalDecl;
  };

  // We need to add all the global prototype variable declarations in the script
  const createFinalDecl = () => {
    for (const upValue in sglobals) {
      if (Object.prototype.hasOwnProperty.call(sglobals, upValue)) {
        const globalVariables = sglobals[upValue];
        finalDecl = 'let ' + upValue + ' = {};\n' + finalDecl;
        for (const declName in globalVariables) {
          if (Object.prototype.hasOwnProperty.call(globalVariables, declName)) {
            const name = globalVariables[declName];
            finalDecl = createCSGlobal(name, finalDecl, upValue, methodNames);
          }
        }
      }
    }
    finalDecl = passJSONFiles(finalDecl, createCSGlobal, cglobals, globalNames);
    finalDecl += 'Math = new Proxy( Math, pr["proxyExportHandler"]);\n';
    finalDecl = passJSONFiles(finalDecl, createGlobal, globals);

    return finalDecl;
  };

  // The first time this runs we create the decl
  const globalsDecl = () => {
    if (finalDecl === ' ') {
      userRemoves();
      generateNames(toSaveNames);
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

  // We export the name of the curr module and pass proxy to the final function
  vm.runInThisContext = function(code, options) {
    const codeToRun = originalRun(code, options);
    env.requireLevel++;
    trueName[env.requireLevel] = options['filename'];
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

    // If they are things in export obj we write it in analysis
    if (Object.keys(result).length && env.requireLevel != 0) {
      policy.exportObj('module.export');
    }

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
  const exportHandler = {
    get: function(target, name, receiver) {
      const type = typeof target[name];
      if (type != 'undefined' && target[name] != null && typeof name === 'string' &&
          (!(target[name] instanceof RegExp))) { // + udnefined
        // If we try to grab an object we wrap it in this proxy
        if (type === 'object') {
          if ((!(Object.entries(target[name]).length === 0))) {
            // We first return the obj to check that is not wraped in a proxy
            if (withProxy.has(target[name])) {
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
            withProxy.set(result, true);

            return result;
          }
        } else if (type === 'function') {
          // We first return the obj to check that is not wraped in a proxy
          let localFunction = target[name];
          if (!withProxy.has(target[name])){
            Object.defineProperty(localFunction, 'name', {value: name});
            target[name] = new Proxy(localFunction, policy.exportsFuncHandler);

            // We keep in storePureFunctions the function without the proxy
            storePureFunctions.set(target[name], localFunction);
            objPath.set(localFunction, trueName[env.requireLevel]);
            objName.set(localFunction, objName.get(target));
          } else {
            objPath.set(storePureFunctions.get(localFunction), trueName[env.requireLevel]);
            objName.set(storePureFunctions.get(localFunction), objName.get(target));
          }

          // Undefined fix
          policy.readFunction(localFunction, objName.get(target));

          result = Reflect.get(target, name);
          withProxy.set(result, true);
          return result;
        } else if (type === 'number' || type === 'boolean' || type === 'string') {
          policy.updateRestData(target, name, type);
        }
      }

      return Reflect.get(target, name);
    },
    set: function(target, name, value) {
      // We catch the declaration of a value
      policy.exportObj(objName.get(target) + '.' +name);
      return Reflect.set(target, name, value);
    }
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

  return mainRequire(callerRequire);
}

module.exports = {
  preset: preset,
  configRequire: (origRequire, origConfig) => {
    // TODO: fix order
    return lyaStartUp(origConfig, origRequire);
  },
};
