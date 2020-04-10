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
  RWX_CHECKING: './rwx-checking.js',
  GLOBAL_ONLY: './global-only.js',
  EXPORT_TYPE: './export-type.js',
  COARSE_TYPES: './coarse-types.js',
  SIMPLE_TYPES: './simple-types.js',
  SUB_TYPES: './sub-types.js',
};

const systemPreset = {
  // TODO: Rewrite flags structure
  WITH_ENABLE : true,
  INPUT_STRING: true,
  DEBUG_FLAG: false,
  TRACKING: [
    'user-globals',
    'es-globals',
    'node-globals',
    'module-locals',
    'module-returns'
  ],
  DEPTH: 0,
}

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

  // This holds the string of the transformations inside modules
  let prologue = '';

  // WeakMaps to store the name and the path for every object value
  const objectName = new WeakMap();
  const objectPath = new WeakMap();
  const methodNames = new WeakMap();
  const storePureFunctions = new WeakMap();
  const globalNames = new Map();
  const withProxy = new WeakMap();
  const passedOver = new Map();

  // The counter for the wrapped objects and functions
  const counters = {
    total: 0,
    object: 0,
    function: 0,
  };

  // We read and store the data of the json file
  const defaultNames = require('./default-names.json');

  // Returns the objects name
  const getObjectInfo = (obj) => {
    const objName = objectName.has(obj) ? objectName.get(obj)
      : methodNames.has(obj) ? methodNames.get(obj)
      : globalNames.has(obj.name) ? globalName.get(obj.name)
      : (obj.name) ? obj.name
      : null;
    const objPath = objectPath.has(obj) ? objectPath.get(obj)
      : null;
    // TODO: Add more info...?
    return {
      name : objName,
      path : objPath
    }
  }
  // We make a test on fragment
  const env = {
    conf: lyaConfig,
    moduleName: moduleName,
    requireLevel: requireLevel,
    analysisResult: analysisResult,
    getObjectInfo : getObjectInfo,
    counters: counters,
  };

  // user-globals: e.g., global.x, x,                                   [global, x]
  // es-globals: Math, Map, Array,                                      [Math, PI]
  // node-globals: console, setImmediate,                               [console, log]
  // module-locals: exports, require, module, __filename, __dirname     [require]
  // module-returns: exports, module.exports                            [ID, math, pi]
  // One create handler to rule them all
  // TODO: Add option to return specific handlers, only get,set or only apply etc..
  const createHandler = (moduleClass) => {
    return {
      apply: function(target, thisArg, argumentsList) {
        const currentName = objectPath.get(target);
        const birthplace = objectName.has(target) ? objectName.get(target) : null;
        const birthName = birthplace + '.' + target.name;
        const currentModule = moduleName[env.requireLevel];
        const origReqModuleName = argumentsList[0];

        const nameToStore =
          (target.name === 'require') ? 'require(\'' + origReqModuleName + '\')'
          : methodNames.has(target) ? methodNames.get(target)
          : (birthplace && (currentModule === currentName)) ? birthName
          : null;

        if (nameToStore) {
          policy.onCallPre(target, thisArg, argumentsList, target.name, nameToStore,
            currentModule, currentName, moduleClass);
        };
        const result = Reflect.apply(...arguments);

        if (nameToStore) {
          policy.onCallPost(target, thisArg, argumentsList, target.name, nameToStore,
            currentModule, currentName, moduleClass, result);
        };

        return result;
      },
      get: function(target, name) {
        const currentModule = objectPath.get(target);
        const storeName = globalNames.has(name) ? globalNames.get(name)
          : globalNames.has(target[name]) ? globalNames.get(target[name])
          : methodNames.has(target) ? methodNames.get(target)
          : null;

        if (storeName && name) {
          policy.onRead(target, name, storeName, currentModule, moduleClass);
        }

        return Reflect.get(...arguments);
      },
      set: function(target, name, value) {
        const currentModule = objectPath.get(target);

        if (methodNames.has(target)) {
          const parentName = methodNames.get(target);
          const nameToStore = parentName + '.' + name;
          policy.onWrite(target, name, value, currentModule, parentName, nameToStore);
          if (methodNames.get(target) === 'global' ||
            methodNames.get(target) === 'process.env') {
            globalNames.set(name, nameToStore);
          }
        }

        return Reflect.set(...arguments);
      },
      has: function(target, prop) {
        const currentName = env.moduleName[env.requireLevel];
        const parentObject = methodNames.get(target);
        const result =  Reflect.has(...arguments);
        const nameToStore = parentObject + '.' + prop;
        if (parentObject === 'global' && !result &&
          prop !== 'localGlobal') {
          policy.onHas(target, prop, currentName, nameToStore);
        }

        return result;
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

  const setProxy = (obj, handler, type) => {
    counters.total++;
    counters[type]++;
    return new Proxy(obj, handler);
  }
  // We wrap the global variable in a proxy
  const createGlobalPr = () => {
    if (!lyaConfig.track.includes('user-globals')) {
      return global;
    }

    const tempGlobal = setProxy(global, {}, 'object');
    methodNames.set(tempGlobal, 'global');
    objectPath.set(tempGlobal, moduleName[env.requireLevel]);
    const handler = createHandler('user-globals');
    return setProxy(tempGlobal, {
      get: handler.get,
      set: handler.set,
      has: handler.has,
    }, 'object');
  }

  // TODO: this should come from generate
  const moduleInputNames = defaultNames.locals.node;

  // require, __dirname, __filename
  const wrapModuleInputs = (obj, count) => {
    const type = typeof obj[count];
    let localCopy;
    if (type === 'string') {
      if (lyaConfig.inputString) {
        localCopy = new String(obj[count]);
      } else {
        return obj[count];
      }
    } else {
      localCopy = obj[count];
    }
    methodNames.set(localCopy, moduleInputNames[count]);
    objectPath.set(localCopy, moduleName[env.requireLevel]);
    if (!lyaConfig.track.includes('module-locals')) {
      return localCopy;
    }
    const handler = createHandler('module-locals');
    return setProxy(localCopy, {
      apply: handler.apply,
      get: handler.get,
      set: handler.set,
    }, 'object');
  };

  const setLocalGlobal = () => {
    let localGlobal = {};
    localGlobal = passJSONFile(createGlobal, defaultNames.globals);
    if (lyaConfig.track.includes('es-globals')) {
      localGlobal['proxyExportHandler'] = createHandler('es-globals');
    }
    localGlobal['proxyGlobal'] = createGlobalPr();

    return localGlobal;
  }

  // We wrap the input values of every module in a proxy
  const handlerAddArg= {
    apply: function(target, thisArg, argumentsList) {
      for (let count=0; count < 5; count++) {
        argumentsList[count] = wrapModuleInputs(argumentsList, count);
      }
      argumentsList[5] = setLocalGlobal();
      argumentsList[6] = createGlobalPr();
      return Reflect.apply(...arguments);
    },
  };

  const uniqueWrap = (obj, handler, name, type) => {
    const noProxyOrig = new Proxy(obj, {});
    methodNames.set(noProxyOrig, name);
    objectPath.set(noProxyOrig, moduleName[env.requireLevel]);
    return setProxy(noProxyOrig, handler, type)
  };

  // When depth is !== 0 it wraps the objects in a proxy
  const levelWrapping = (obj, name, handler) => {
    if (lyaConfig.depth && obj !== null) {
      return uniqueWrap(obj, handler, name, 'object');
    } else {
      return obj;
    }
  }

  const getValues = (obj) => {
    if (Object.keys(obj).length) {
      return Object.keys(obj);
    } else {
      return Object.getOwnPropertyNames(obj);
    }
  };

  // We wrap every function on global obj that exists in default-names.json
  // Returns the proxy obj we want
  const objTypeAction = (obj, name, handler, givenFunc, nameSave) => {
    const localGlobal = {};
    if (Object.prototype.hasOwnProperty.call(obj, name)) {
      const objType = typeof obj[name];
      const saveName = givenFunc + '.' + name;
      if (objType === 'object') {
        const wrappedObj = levelWrapping(obj[name], saveName, handler);
        localGlobal[name] = proxyWrap(wrappedObj);
      } else if (objType === 'function') {
        localGlobal[name] = uniqueWrap(obj[name], handler, saveName, objType)
      } else if (objType === 'number') {
        globalNames.set(obj[name], saveName);
        localGlobal[name] = obj[name];
      }
    }
    return localGlobal[name];
  };

  const proxyWrap = function(handler, origGlobal, saveName) {
    const objType = typeof origGlobal;
    let localGlobal = {};
    if (objType === 'function') {
      localGlobal = uniqueWrap(origGlobal, handler, saveName, objType);
    } else if (objType === 'object') {
      const processedObj = levelWrapping(origGlobal, saveName, handler);
      for (const name of getValues(processedObj)) {
        localGlobal[name] = objTypeAction(processedObj, name, handler,
          saveName);
      }
    }
    return localGlobal;
  };

  const createGlobal = (name) => {
    if (global[name] !== undefined) {
      if (!lyaConfig.track.includes('node-globals')) {
        return global[name];
      }
      const proxyObj = proxyWrap(createHandler('node-globals'), global[name], name);
      objectPath.set(proxyObj, moduleName[env.requireLevel]);
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
        for (const name of json[funcClass]) {
          returnValue[name] = func(name);
        }
      }
    }

    return returnValue;
  };

  // This will run once and produce prologue string
  const setPrologue = () => {
    passJSONFile(setDeclaration, defaultNames.globals);
    prologue += 'let global = localGlobal["proxyGlobal"]\n';
    if (lyaConfig.track.includes('es-globals')) {
      prologue += 'Math = new Proxy(Math, localGlobal["proxyExportHandler"]);\n';
    }
    prologue = lyaConfig.withEnable ? 'with (withGlobal) {\n' + prologue
      : prologue;
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

  // TODO: Combine with flattenAndSkip
  const skipMe = (group) => {
    for (const v in group) {
      group[v] = group[v].filter((e) =>
        !lyaConfig.removejson.includes(e));
    }
    return group;
  };

  // User can remove things from json file that create conf
  const generateGlobals = () => {
    // flatten globals under defaultNames.globals.*
    flattenAndSkip(["es", "node", "other"], "globals");
    defaultNames.globals = skipMe(defaultNames.globals);
    // flatten locals under defaultNames.locals.*
    flattenAndSkip(["node"], "locals");
  };

  // extend wrap to take additional argument
  Module.wrap = (script) => {
    script = lyaConfig.withEnable ? getPrologue() + script + '}' :
      getPrologue() + script;
    const wrappedScript = originalWrap(script).replace('dirname)',
      'dirname, localGlobal, withGlobal)');
    if (lyaConfig.debugFlag) {
      console.log(wrappedScript);
    }
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
    return setProxy(codeToRun, handlerAddArg, 'object');
  };

  // We wrap the result in the wrapper function
  Module.prototype.require = function(...args) {
    const path = args[0];
    let moduleExports = originalRequire.apply(this, args);
    const type = typeof moduleExports;

    if (type !== 'boolean' && type !== 'symbol' &&
          type !== 'number' && type !== 'string') {
      if (!objectName.has(moduleExports)) {
        objectName.set(moduleExports, 'require(\'' + path + '\')');
        objectPath.set(moduleExports, moduleName[env.requireLevel]);
        if (lyaConfig.track.includes('module-returns')) {
          moduleExports = setProxy(moduleExports, exportHandler, type);
        };
        if (env.requireLevel !== 0 &&
          nativeModules.indexOf(path) === -1) {
          env.requireLevel--;
        }
      } else {
        moduleExports = setProxy(moduleExports, exportHandler, type);
        objectName.set(moduleExports, 'require(\'' + path + '\')');
        objectPath.set(moduleExports, moduleName[env.requireLevel]);
      }
    }
    return moduleExports;
  };

  // This is the handler of the export object. Every time we require a module,
  // and it has export data we wrap those data in this handler. So this is
  // the first So this is the first layer of the export data wraping.
  const namePathSet = (key, name, path) => {
    objectName.set(key, name);
    objectPath.set(key, path);
  };


  const exportHandler = {
    apply: function(target, thisArg, argumentsList) {
      const nameToStore = objectName.get(target);
      const currModule = moduleName[env.requireLevel];
      const declareModule = moduleName[env.requireLevel];
      policy.onCallPre(target, thisArg, argumentsList, target.name,
          nameToStore, currModule, declareModule);

      return Reflect.apply(...arguments);
    },
    get: function(target, name, receiver) {
      const exportType = typeof target[name];
      if (exportType !== 'undefined' && target[name] != null &&
          typeof name === 'string' && (!(target[name] instanceof RegExp))) {
        if (exportType === 'object') {
          if (withProxy.has(target[name])) {
            return Reflect.get(...arguments);
          }
          if (Object.entries(target[name]).length) {
            const currObject = target[name];
            const currModule = moduleName[env.requireLevel];
            const fatherName = objectName.get(receiver) ?
                objectName.get(receiver) : objectName.get(target);
            const birthplace = objectPath.get(receiver) ?
                objectPath.get(receiver) : objectPath.get(target);
            const childName = fatherName + '.' + name;
            policy.onRead(target, name, childName, currModule);
            target[name] = setProxy(target[name], exportHandler, exportType);
            namePathSet(currObject, childName, birthplace);

            const result = Reflect.get(...arguments);
            withProxy.set(result, true);
            return result;
          }
        } else if (exportType === 'function') {
          const currFunction = target[name];
          const parentName = objectName.get(target);
          const currModule = moduleName[env.requireLevel];
          const nameToStore = parentName + '.' +name;

          if (!withProxy.has(target[name])) {
            Object.defineProperty(currFunction, 'name', {value: name});
            target[name] = setProxy(currFunction,{
              apply: createHandler('module-returns').apply
            }, exportType);
            storePureFunctions.set(target[name], currFunction);
            namePathSet(currFunction, parentName, currModule);
            policy.onRead(target, name, nameToStore, currModule);
          } else {
            const key = storePureFunctions.get(currFunction);
            namePathSet(key, parentName, currModule);
          }

          const result = Reflect.get(...arguments);
          withProxy.set(result, true);
          return result;
        } else if (exportType === 'number' || exportType === 'boolean' ||
            exportType === 'string') {

          const parentName = objectName.get(target);
          const nameToStore = parentName + '.' + name;
          const currModule = moduleName[env.requireLevel];
          if (!passedOver.has(nameToStore + currModule)) {
            policy.onRead(target, name, nameToStore, currModule);
            passedOver.set(nameToStore + currModule, true);
          }
        }
      }

      return Reflect.get(...arguments);
    },
    set: function(target, name, value) {
      const parentName = objectName.get(target);
      const nameToStore = parentName + '.' + name;
      const currModule = moduleName[env.requireLevel];
      policy.onWrite(target, name, value, currModule, parentName, nameToStore);
      return Reflect.set(...arguments);
    },
  };

  process.on('exit', function() {
    // First, check if the current analysis has set an exit handler;
    // if yes, invoke it, without any parameters: the current analysis has
    // access to the lya config and can decide what to do
    if (policy.onExit) {
      policy.onExit();
    } else {
      // if not, our default handler should print or write the results to a file
      if (lyaConfig.SAVE_RESULTS) {
        fs.writeFileSync(env.conf.SAVE_RESULTS,
          JSON.stringify(env.analysisResult, null, 2), 'utf-8');
      }
    }
    // optionally, we can do some other cleanup too
  });

  return setProxy(callerRequire, createHandler('module-locals'), 'function');
};

module.exports = {
  preset: preset,
  configRequire: (origRequire, conf) => {
    conf.analysis = conf.analysis || preset.ALLOW_DENY;
    if (fs.existsSync(conf.analysis)) {
      console.error('Analysis file not found: ', conf.analysis);
    }
    // TODO: maybe exapand to a local
    // we can change the name 'removejson' to 'excludes', 'excluded' or 'except'
    conf.removejson = conf.removejson || [];
    // TODO: create a function that assigns default values to the config (which
    // should be first parameterized by individual analysis)
    conf.withEnable = conf.withEnable === false ? conf.withEnable :
      systemPreset.WITH_ENABLE;
    conf.inputString = conf.inputString === false ? conf.inputString:
      systemPreset.INPUT_STRING;
    conf.debugFlag = conf.debugFlag ? conf.debugFlag :
      systemPreset.DEBUG_FLAG;
    conf.track = conf.dontTrack ? systemPreset.TRACKING.filter((e) =>
      !conf.dontTrack.includes(e)) : systemPreset.TRACKING;
    conf.depth = conf.depth ? conf.depth : systemPreset.DEPTH;
    return lyaStartUp(origRequire, conf);
  },
};
