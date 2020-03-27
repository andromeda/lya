/* eslint prefer-rest-params: "off", no-global-assign: "off",
no-shadow-restricted-names: "off" */

const nativeModules = Object.keys(process.binding('natives'));
const Module = require('module');
const vm = require('vm');
const fs = require('fs');

const preset = {
  ALLOW_DENY: './allow-deny.js',
  CALL_NUMBERS: './call-numbers.js',
  PROFILING: './profiling.js',
  PROFILING_RELATIVE: './profiling-relative.js',
  ALLOW_DENY_ENFORCEMENT: './allow-deny-enforcement.js',
  RWX: './rwx.js',
  RWX_ENFORCEMENT: './rwx-enforcement.js',
  GLOBAL_ONLY: './global-only.js',
  EXPORT_TYPE: './export-type.js',
  COARSE_TYPES: './coarse-types.js',
  SIMPLE_TYPES: './simple-types.js',
  SUB_TYPES: './sub-types.js',
};

const lyaStartUp = (callerRequire, lyaConfig) => {
  // All the necessary modules for swap
  const originalWrap = Module.wrap;
  const originalRequire = Module.prototype.require;
  const originalRun = vm.runInThisContext;

  const moduleName = [];
  const requireLevel = 0;
  const analysisResult = {};

  moduleName[0] = process.cwd() + '/' + 'main.js';
  analysisResult[moduleName[0]] = {};

  // Holds the end of each name store of new assigned global variables
  // suffix for our own metadata
  const endName = '@name';

  // This holds the string of the transformations inside modules
  let prologue = '';

  // WeakMaps to store the name and the path for every object value
  const objName = new WeakMap();
  const objPath = new WeakMap();
  const methodNames = new WeakMap();
  const storePureFunctions = new WeakMap();
  const withProxy = new WeakMap();
  const globalNames = new Map();

  // We read and store the data of the json file
  const defaultNames = require('./default-names.json');

  // We make a test on fragment
  const env = {
    moduleName: moduleName,
    requireLevel: requireLevel,
    analysisResult: analysisResult,
    objName: objName,
    objPath: objPath,
    methodNames: methodNames,
    globalNames: globalNames,
    // Signal if program has ended, necessary for enforcements
    end: false,
  };

  // user-globals: e.g., global.x, x,                                   [global, x]
  // es-globals: Math, Map, Array,                                      [Math, PI]
  // node-globals: console, setImmediate,                               [console, log]
  // module-locals: exports, require, module, __filename, __dirname     [require]
  // module-returns: exports, module.exports                            [ID, math, pi]
  // One create handler to rule them all
  const createHandler = (moduleClass) => {
    return {
      apply: function(target, thisArg, argumentsList) {
        const currentName = objPath.get(target);
        const birthplace = objName.has(target) ? objName.get(target) : null;
        const birthName = birthplace + '.' + target.name;
        const currentModule = moduleName[env.requireLevel];
        const origReqModuleName = argumentsList[0];

        const nameToStore =
          (target.name === 'require') ? 'require(\'' + origReqModuleName + '\')'
          : methodNames.has(target) ? methodNames.get(target)
          : (birthplace && (currentModule === currentName)) ? birthName
          : null;

        if (nameToStore) {
          policy.onCallPre(target, target.name, nameToStore, currentModule, currentName,
            moduleClass);
        };

        const result = Reflect.apply(target, thisArg, argumentsList);

        if (nameToStore) {
          policy.onCallPost(target, target.name, nameToStore, currentModule, currentName,
            moduleClass, result);
        };

        return result;
      },
      get: function(target, name) {
        const currentModule = globalNames.has(name) ?  env.moduleName[env.requireLevel]
          : env.objPath.get(target);

        const storeName = globalNames.has(name) ? globalNames.get(name)
          : globalNames.has(target[name]) ? globalNames.get(target[name])
          : env.methodNames.has(target) ? methodNames.get(target)
          : null;

        if (storeName) {
          policy.onRead(target, name, storeName, currentModule, moduleClass);
        }

        return Reflect.get(target, name);
      },
      set: function(target, name, value) {
        const currentModule = env.objPath.get(target);

        if (methodNames.has(target)) {
          const parentName = methodNames.get(target);
          const nameToStore = parentName + '.' + name;
          policy.onWrite(target, name, value, currentModule, parentName, nameToStore);
          if (methodNames.get(target) === 'global') {
            globalNames.set(name, nameToStore);
          }
        }

        return Reflect.set(target, name, value);
      },
      construct: function(target, args) {
        const currentName = env.moduleName[env.requireLevel];
        const nameToStore = target.name;
        if (target.name !== 'Proxy') {
          policy.onConstruct(target, args, currentName, nameToStore)
        }

        return new target(...args);
      }
    }
  }

  // Import the right policy depending on the choice of the user.
  const policy = require(lyaConfig.analysis)(env);

  // TODO: Make this local to every module by passing it in prologue
  // We wrap the global variable in a proxy
  methodNames.set(global, 'global');
  objPath.set(global, moduleName[env.requireLevel])
  global = new Proxy(global, createHandler('user-globals'));

  // TODO: this should come from generate
  const moduleInputNames = defaultNames.locals.node;

  // require, __dirname, __filename
  const wrapModuleInputs = (obj, count) => {
    const type = typeof obj[count];
    let localCopy;
    if (type === 'string') {
      localCopy = new String(obj[count]);
    } else {
      localCopy = obj[count];
    }
    methodNames.set(localCopy, moduleInputNames[count]);
    objPath.set(localCopy, moduleName[env.requireLevel]);
    return new Proxy(localCopy, createHandler('module-locals'));
  };

  const setLocalGlobal = () => {
    let localGlobal = {};
    localGlobal = passJSONFile(createGlobal, defaultNames.globals);
    localGlobal['proxyExportHandler'] = createHandler('es-globals');
    const noProxyOrig = new Proxy(global['process']['env'], {});
    localGlobal['process.env'] = new Proxy(noProxyOrig, exportHandler);
    objName.set(noProxyOrig, 'process.env');

    return localGlobal;
  }

  // We wrap the input values of every module in a proxy
  const handlerAddArg= {
    apply: function(target, thisArg, argumentsList) {
      for (let count=0; count < 5; count++) {
        argumentsList[count] = wrapModuleInputs(argumentsList, count);
      }
      argumentsList[5] = setLocalGlobal();
      return Reflect.apply( ...arguments);
    },
  };

  const getObjLength = (obj) => Object.keys(obj).length;
  const getObjValues = (obj) => Object.getOwnPropertyNames(obj);

  // We wrap every function on global obj that exists in default-names.json
  // Returns the proxy obj we want
  const objTypeAction = (obj, name, handler, givenFunc, nameSave) => {
    const localGlobal = {};
    if (Object.prototype.hasOwnProperty.call(obj, name)) {
      const objType = typeof obj[name];
      if (objType === 'object') {
        localGlobal[name] = proxyWrap(obj[name]);
      } else if (objType === 'function') {
        const noProxyOrig = new Proxy(obj[name], {});
        methodNames.set(noProxyOrig, givenFunc + '.' + name);
        objPath.set(noProxyOrig, moduleName[env.requireLevel]);
        localGlobal[name] = new Proxy(noProxyOrig, handler);
      } else if (objType === 'number') {
        globalNames.set(obj[name], givenFunc + '.' + name);
        localGlobal[name] = obj[name];
      }
    }
    return localGlobal[name];
  };

  const proxyWrap = function(handler, origGlobal, objName) {
    const objType = typeof origGlobal;
    let localGlobal = {};
    if (objType === 'function') {
      const noProxyOrig = new Proxy(origGlobal, {});
      methodNames.set(noProxyOrig, objName);
      objPath.set(noProxyOrig, moduleName[env.requireLevel]);
      localGlobal = new Proxy(noProxyOrig, handler);
      // TODO: Add the if code !getObjLength(origGlobal)
      // under here if want to wrap the second level under
      // functions. lines (150...158);
      // etc to Catch : Array.of, Object.keys, constructor.getOwnPropertyNames
      // maybe add this as an input from the user, to specify the depth of
      // the analysis.
    } else if (objType === 'object') {
      if (!getObjLength(origGlobal)) {
        const values = getObjValues(origGlobal);
        for (const key in values) {
          if (Object.prototype.hasOwnProperty.call(values, key)) {
            const name = values[key];
            localGlobal[name] = objTypeAction(origGlobal, name, handler,
                objName);
          }
        }
      } else {
        for (const key in origGlobal) {
          if (Object.prototype.hasOwnProperty.call(origGlobal, key)) {
            localGlobal[key] = objTypeAction(origGlobal, key, handler,
                objName);
          }
        }
      }
    }
    return localGlobal;
  };

  const createGlobal = (name) => {
    if (global[name] !== undefined) {
      const proxyObj = proxyWrap(createHandler('node-globals'), global[name], name);
      objPath.set(proxyObj, moduleName[env.requireLevel]);
      return proxyObj;
    }
    return 0;
  };

  const setDeclaration = (name) => {
    prologue += 'let ' + name + ' = localGlobal["' + name +'"];\n';
  };

  const passJSONFile = (func, json) => {
    let returnValue = {};
    for (const funcClass in json) {
      if (Object.prototype.hasOwnProperty.call(json, funcClass)) {
        const builtInObj = json[funcClass];
        for (const counter in builtInObj) {
          if (Object.prototype.hasOwnProperty.call(builtInObj, counter)) {
            const functionName = builtInObj[counter];
            returnValue[functionName] = func(functionName);
          }
        }
      }
    }

    return returnValue;
  };

  // This will run once and produce prologue string
  const setPrologue = () => {
    passJSONFile(setDeclaration, defaultNames.globals);
    prologue += 'process.env = localGlobal["process.env"];\n';
    prologue += 'Math = new Proxy(Math, localGlobal["proxyExportHandler"]);\n';
    return prologue;
  };

  // The first time this runs we create the decl
  const getPrologue = () => {
    if (prologue !== '') {
      return prologue;
    }
    generateGlobals();
    return setPrologue();
  };

  // User can remove things from json file that create conf
  const flattenAndSkip = (groups, under) => {
    groups.filter((e) => {
      lyaConfig.removejson.indexOf(e)
    }).forEach((e) => {
      for (const v in defaultNames[under][e]) {
        if (!lyaConfig.removejson.indexOf(v)) {
          defaultNames[under][v] = true;
        }
      }
      // TODO: remove e
      // delete defaultNames[under][e];
    });
  };

  // User can remove things from json file that create conf
  const generateGlobals = () => {
    // flatten globals under defaultNames.globals.*
    flattenAndSkip(["es", "node", "other"], "globals");
    // flatten locals under defaultNames.globals.*
    flattenAndSkip(["node"], "locals");
  };

  // extend wrap to take additional argument
  Module.wrap = (script) => {
    script = getPrologue() + script;
    let wrappedScript = originalWrap(script);
    wrappedScript = wrappedScript.replace('dirname)', 'dirname, localGlobal)');
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
    const type = typeof result;

    if (type !== 'boolean' && type !== 'symbol' &&
          type !== 'number' && type !== 'string') {
      if (!objName.has(result)) {
        objName.set(result, 'require(\'' + path + '\')');
        objPath.set(result, moduleName[env.requireLevel]);
        result = new Proxy(result, exportHandler);
        if (env.requireLevel !== 0 &&
          nativeModules.indexOf(path) === -1) {
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

  // This is the handler of the export object. Every time we require a module,
  // and it has export data we wrap those data in this handler. So this is
  // the first So this is the first layer of the export data wraping.
  const namePathSet = (key, name, path) => {
    objName.set(key, name);
    objPath.set(key, path);
  };


  const exportHandler = {
    apply: function(target, thisArg, argumentsList) {
      const nameToStore = objName.get(target);
      const currModule = moduleName[env.requireLevel];
      const declareModule = moduleName[env.requireLevel];
      policy.onCallPre(target, target.name, nameToStore, argumentsList,
        currModule, declareModule);

      return Reflect.apply(target, thisArg, argumentsList);
    },
    get: function(target, name, receiver) {
      const exportType = typeof(target[name]);
      if (exportType !== 'undefined' && target[name] != null &&
          typeof name === 'string' && (!(target[name] instanceof RegExp))) {
        if (exportType === 'object') {
          if (Object.entries(target[name]).length) {
            if (withProxy.has(target[name])) {
              return Reflect.get(target, name);
            }
            const currObject = target[name];
            const fatherName = objName.get(receiver) ? objName.get(receiver) :
              objName.get(target);
            const birthplace = objPath.get(receiver) ? objPath.get(receiver) :
              objPath.get(target);
            const childName = fatherName + '.' + name;

            target[name] = new Proxy(target[name], exportHandler);
            namePathSet(currObject, childName, birthplace);

            const result = Reflect.get(target, name);
            withProxy.set(result, true);
            return result;
          }
        } else if (exportType === 'function') {
          const currFunction = target[name];
          const parentName = objName.get(target);
          const currModule = moduleName[env.requireLevel];
          const nameToStore = parentName + '.' +name;

          if (!withProxy.has(target[name])) {
            Object.defineProperty(currFunction, 'name', {value: name});
            target[name] = new Proxy(currFunction, createHandler('module-returns'));
            storePureFunctions.set(target[name], currFunction);
            namePathSet(currFunction, parentName, currModule);
          } else {
            const key = storePureFunctions.get(currFunction);
            namePathSet(key, parentName, currModule);
          }

          //policy.onRead(target, name, nameToStore, currModule);
          policy.readFunction(parentName);
          policy.readFunction(parentName + '.' + name);


          const result = Reflect.get(target, name);
          withProxy.set(result, true);
          return result;
        } else if (exportType === 'number' || exportType === 'boolean' ||
            exportType === 'string') {

          const parentName = objName.get(target);
          const nameToStore = parentName + '.' +name;
          const currModule = moduleName[env.requireLevel];
          //policy.onRead(target, name, nameToStore, currModule);
          policy.readFunction(objName.get(target));
          policy.readFunction(objName.get(target) + '.' +name);
        }
      }

      return Reflect.get(target, name);
    },
    set: function(target, name, value) {
      const parentName = objName.get(target);
      const nameToStore = parentName + '.' +name;
      const currModule = moduleName[env.requireLevel];
      policy.onWrite(target, name, value, currModule, parentName,
        nameToStore);

      return Reflect.set(target, name, value);
    },
  };

  // We print all the results at the end of the analysis
  process.on('exit', function() {
    env.end = true;
    if (lyaConfig.SAVE_RESULTS && !/ENFORCEMENT$/.test(lyaConfig.analysis)) {
      fs.writeFileSync(lyaConfig.SAVE_RESULTS,
          JSON.stringify(analysisResult, null, 2), 'utf-8');
    }
  });
  return new Proxy(callerRequire, createHandler('module-locals'));
};

module.exports = {
  preset: preset,
  configRequire: (origRequire, conf) => {
    conf.analysis = conf.analysis || preset.ALLOW_DENY;
    if (fs.existsSync(conf.analysis)) {
      console.error('Analysis file not found: ', conf.analysis);
    }
    // TODO: maybe exapand to a local
    conf.removejson = conf.removejson || [];
    return lyaStartUp(origRequire, conf);
  },
};
