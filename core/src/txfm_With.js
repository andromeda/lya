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
  SUB_TYPES: 12,
};

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

  const moduleName = [];
  const requireLevel = 0;
  const globalProxies = {};
  const analysisResult = {};

  moduleName[0] = process.cwd() + '/' + 'main.js';
  analysisResult[moduleName[0]] = {};

  // Holds the end of each name store of new assigned global variables
  // suffix for our own metadata
  const endName = '@name';

  // This holds the string of the transformations inside modules
  let moduleProlog = ' ';

  // WeakMaps to store the name and the path for every object value
  const objName = new WeakMap();
  const objPath = new WeakMap();
  const methodNames = new WeakMap();
  const storePureFunctions = new WeakMap();
  const withProxy = new WeakMap();
  const globalNames = new Map();

  // We read and store the data of the json file
  const globals = require('./globals.json');
  const toSaveNames = require('./saveNames.json');

  // We make a test on fragment
  const env = {
    moduleName: moduleName,
    requireLevel: requireLevel,
    analysisResult: analysisResult,
    objName: objName,
    objPath: objPath,
    methodNames: methodNames,
    globalNames: globalNames,
  };

  // We return the choice of the user
  // TODO: define a var currentAnalysis and use it everywhere
  const a = lyaConfig.analysis || preset.ALLOW_DENY;
  const userChoice = Object.keys(preset).map((e) => preset[e]).includes(a)? a : preset.ALLOW_DENY;

  // You import the right policy depenting on the choice of the user.
  const policy = require('./policy' + userChoice + '.js')(env);

  // We wrap the global variable in a proxy
  global = new Proxy(global, policy.globalHandler);

  // A proxy to use it in Math.PI etc
  globalProxies['proxyExportHandler'] = policy.globalConstHandler;

  // This function stores the names of the given object to
  // methodNames WeakMap ~> stores names of objs like console etc
  function generateNames(obj) {
    for (k in obj) {
      const functionNames = global[obj[k]];
      for (name in functionNames) {
        if (typeof name === 'string' && name != undefined) {
          const nameToStore = obj[k] + '.' + name;
          methodNames.set(functionNames[name], nameToStore);
        }
      }
    }
  }

  const moduleInputNames = [
    'exports',
    'require',
    'module',
    '__filename',
    '__dirname',
  ];

  const wrapModuleInputs = (obj, count) => {
    const type = typeof obj[count];
    let localCopy;
    if (type === 'string') {
      localCopy = new String(obj[count]);
    } else {
      localCopy = obj[count];
    }
    methodNames.set(localCopy, moduleInputNames[count]);
    return new Proxy(localCopy, policy.require);
  };

  // We wrap the input values of every module in a proxy
  const handlerAddArg= {
    apply: function(target, thisArg, argumentsList) {
      for (let count=0; count < 5; count++) {
        argumentsList[count] = wrapModuleInputs(argumentsList, count);
      }
      argumentsList[5] = globalProxies;
      argumentsList[6] = global;

      return Reflect.apply( ...arguments);
    },
  };

  const saveName = (obj, name, givenFunc) => methodNames.set(obj[name], givenFunc + '.' + name);
  const getObjLength = (obj) => Object.keys(obj).length;
  const getObjValues = (obj) => Object.getOwnPropertyNames(obj);

  // We wrap every function on global obj that exists in globals.json
  // Returns the proxy obj we want
  const objTypeAction = (obj, name, handler, givenFunc, nameSave) => {
    const localGlobal = {};
    if (Object.prototype.hasOwnProperty.call(obj, name)) {
      const objType = typeof obj[name];
      if (objType === 'object') {
        localGlobal[name] = proxyWrap(obj[name]);
      } else if (objType === 'function') {
        nameSave ? saveName(obj, name, givenFunc) : null;
        localGlobal[name] = new Proxy(obj[name], handler);
      } else if (objType === 'number') {
        globalNames.set(obj[name], givenFunc + '.' + name);
        localGlobal[name] = obj[name];
      }
    }
    return localGlobal[name];
  };

  const proxyWrap = function(handler, origGlobal, givenFunc) {
    const objType = typeof origGlobal;
    let localGlobal = {};
    if (objType === 'function') {
      localGlobal = new Proxy(origGlobal, handler);
    } else if (objType === 'object') {
      if (!getObjLength(origGlobal)) {
        const values = getObjValues(origGlobal);
        for (const key in values) {
          const name = values[key];
          localGlobal[name] = objTypeAction(origGlobal, name, handler, givenFunc, true);
        }
      } else {
        for (const key in origGlobal) {
          origGlobal[key] = objTypeAction(origGlobal, key, handler, givenFunc, false);
        }
        return origGlobal;
      }
    }
    return localGlobal;
  };

  const createGlobal = (name, moduleProlog) => {
    if (global[name] != undefined) {
      globalProxies[name] = proxyWrap(policy.moduleHandler, global[name], name);
      moduleProlog = 'let ' + name + ' = pr["' + name +'"];\n' + moduleProlog;
    }
    return moduleProlog;
  };

  const passJSONFile = (moduleProlog, func, json) => {
    for (const funcClass in json) {
      if (Object.prototype.hasOwnProperty.call(json, funcClass)) {
        const builtInObj = json[funcClass];
        for (const counter in builtInObj) {
          if (Object.prototype.hasOwnProperty.call(builtInObj, counter)) {
            const functionName = builtInObj[counter];
            moduleProlog = func(functionName, moduleProlog);
          }
        }
      }
    }

    return moduleProlog;
  };

  const wrapSpecGlobal = (moduleProlog, globalFunc, specFunc) => {
    const name = globalFunc + '.' + specFunc;
    globalProxies[name] = new Proxy(global[globalFunc][specFunc], exportHandler);
    objName.set(global[globalFunc][specFunc], globalFunc);
    return moduleProlog += name + '= pr["' + name +'"];\n';
  };

  // We need to add all the global prototype variable declarations in the script
  const createModuleProlog = () => {
    moduleProlog = wrapSpecGlobal(moduleProlog, 'process', 'env');
    moduleProlog += 'Math = new Proxy(Math, pr["proxyExportHandler"]);\n';
    moduleProlog = passJSONFile(moduleProlog, createGlobal, globals);
    moduleProlog = 'with (globalRock) {\n' + moduleProlog;
    return moduleProlog;
  };

  // The first time this runs we create the decl
  const globalsDecl = () => {
    if (moduleProlog === ' ') {
      userRemoves();
      generateNames(toSaveNames);
      return createModuleProlog();
    } else {
      return moduleProlog;
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
    script = globalsDecl() + script + '}';
    let wrappedScript = originalWrap(script);
    wrappedScript = wrappedScript.replace('__dirname)', '__dirname, pr, globalRock)');
    return wrappedScript;
  };

  // We export the name of the curr module and pass proxy to the final function
  vm.runInThisContext = function(code, options) {
    const codeToRun = originalRun(code, options);
    env.requireLevel++;
    moduleName[env.requireLevel] = options['filename'];
    if (!Object.prototype.hasOwnProperty.
        call(analysisResult, moduleName[env.requireLevel])) {
      analysisResult[moduleName[env.requireLevel]] = {};
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
        objPath.set(result, moduleName[env.requireLevel]);
        result = new Proxy(result, exportHandler);
        if (env.requireLevel !=0) {
          env.requireLevel--;
        }
      } else {
        result = new Proxy(result, exportHandler);
        objName.set(result, 'require(\'' + path + '\')');
        objPath.set(result, moduleName[env.requireLevel]);
      }
    }
    return result;
  };

  // This is the handler of the export object. Every time we require a module, and it has
  // export data we wrap those data in this handler. So this is the first layer of the
  // export data wraping.
  const namePathSet = (key, name, path) => {
    objName.set(key, name);
    objPath.set(key, path);
  };

  const exportHandler = {
    get: function(target, name, receiver) {
      const exportType = typeof(target[name]);
      if (exportType != 'undefined' && target[name] != null && typeof name === 'string' &&
          (!(target[name] instanceof RegExp))) {
        if (exportType === 'object') {
          if (Object.entries(target[name]).length) {
            if (withProxy.has(target[name])) {
              return Reflect.get(target, name);
            }

            let truename = objName.get(receiver);
            let truepath = objPath.get(receiver);

            if (truename === undefined) {
              truename = objName.get(target);
              truepath = objPath.get(target);
            }

            const localObject = target[name];
            truename = truename + '.' + name;
            target[name] = new Proxy(target[name], exportHandler);

            namePathSet(localObject, truename, truepath);
            result = Reflect.get(target, name);
            withProxy.set(result, true);

            return result;
          }
        } else if (exportType === 'function') {
          const localFunction = target[name];
          const truename = objName.get(target);
          const truepath = moduleName[env.requireLevel];
          if (!withProxy.has(target[name])) {
            Object.defineProperty(localFunction, 'name', {value: name});
            target[name] = new Proxy(localFunction, policy.exportsFuncHandler);
            storePureFunctions.set(target[name], localFunction);
            namePathSet(localFunction, truename, truepath);
          } else {
            const key = storePureFunctions.get(localFunction);
            namePathSet(key, truename, truepath);
          }
          policy.readFunction(localFunction, objName.get(target));
          result = Reflect.get(target, name);
          withProxy.set(result, true);

          return result;
        } else if (exportType === 'number' || exportType === 'boolean' ||
            exportType === 'string') {
          policy.updateRestData(target, name, exportType);
        }
      }

      return Reflect.get(target, name);
    },
    set: function(target, name, value) {
      // We catch the declaration of a value
      policy.exportObj(objName.get(target) + '.' +name);
      return Reflect.set(target, name, value);
    },
  };

  // We print all the results on the end of the program only if we dont
  // use it for enforcement analysis(5, 7) cause we dont want to
  // print anything.
  process.on('exit', function() {
    global.end = true;
    if (lyaConfig.SAVE_RESULTS && userChoice != 5 && userChoice != 7) {
      fs.writeFileSync(lyaConfig.SAVE_RESULTS,
          JSON.stringify(analysisResult, null, 2), 'utf-8');
    }
  });

  return new Proxy(callerRequire, policy.require);
}

module.exports = {
  preset: preset,
  configRequire: (origRequire, origConfig) => {
    // TODO: fix order
    return lyaStartUp(origConfig, origRequire);
  },
};
