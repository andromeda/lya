/* eslint prefer-rest-params: "off", no-global-assign: "off",
no-shadow-restricted-names: "off" */

const nativeModules = Object.keys(process.binding('natives'));
const Module = require('module');
const vm = require('vm');
const fs = require('fs');
const pathJoin = require('path').join;

const preset = {
  ALLOW_DENY: pathJoin(__dirname, 'allow-deny.js'),
  CALL_NUMBERS : pathJoin(__dirname, 'call-numbers.js'),
  PROFILING: pathJoin(__dirname, 'profiling.js'),
  PROFILING_RELATIVE: pathJoin(__dirname, 'profiling-relative.js'),
  ALLOW_DENY_ENFORCEMENT: pathJoin(__dirname, 'allow-deny-enforcement.js'),
  RWX: pathJoin(__dirname, 'rwx.js'),
  RWX_ENFORCEMENT: pathJoin(__dirname, 'rwx-enforcement.js'),
  RWX_CHECKING: pathJoin(__dirname, 'rwx-checking.js'),
  RWX_PERFORMANCE: pathJoin(__dirname, 'rwx-performance.js'),
  GLOBAL_ONLY: pathJoin(__dirname, 'global-only.js'),
  EXPORT_TYPE: pathJoin(__dirname, 'export-type.js'),
  COARSE_TYPES: pathJoin(__dirname, 'coarse-types.js'),
  SIMPLE_TYPES: pathJoin(__dirname, 'simple-types.js'),
  SUB_TYPES: pathJoin(__dirname, 'sub-types.js'),
  STAR_CHECK: pathJoin(__dirname, 'star-check.js'),
};

const systemPreset = {
  // TODO: Rewrite flags structure
  INPUT_STRING: true,
  PRINT_CODE: false,
  DEPTH: 3,
  CONTEXT: {
    enableWith: true,
    include: [
      'user-globals',
      'es-globals',
      'node-globals',
      'module-locals',
      'module-returns'],
    excludes: [],
  },
  MODULES: {
    include: null,
    excludes: null,
  },
  FIELDS: {
    include: true,
    excludes: ['toString', 'valueOf', 'prototype', 'name', 'children'],
  },
}

const lyaStartUp = (callerRequire, lyaConfig) => {
  // All the necessary modules for swap
  const originalWrap = Module.wrap;
  const originalRequire = Module.prototype.require;
  const originalRun = vm.runInThisContext;

  const moduleName = [];
  const requireLevel = 0;
  const analysisResult = {};

  moduleName[0] = process.cwd() + '/' + 'main.js'; // FIXME: What is this?
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
  const clonedFunctions = new Map();

  // This is for write in global, y = 1 etc..
  const candidateGlobs = new Set();
  const candidateModule = new Map();

  // This is for excludes, valueof, toString etc..
  const makeExcludes = (list) => {
    const _excludes = new Map();
    for (const name of list) {
      _excludes.set(name, true);
    };
    return _excludes;
  };
  lyaConfig.fields.excludes = makeExcludes(lyaConfig.fields.excludes);

  // The counter for the wrapped objects and functions
  const counters = {
    total: 0,
    objects: 0,
    functions: 0,
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
          : methodNames.has(target[name]) ? methodNames.get(target[name])
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
          const nameToStore = globalNames.has(name) ? globalNames.get(name) :
            parentName + '.' + name;
          if (globalNames.has(name)) {
            policy.onWrite(target, name, value, currentModule, null, nameToStore);
            return Reflect.set(...arguments);
          }
          policy.onWrite(target, name, value, currentModule, parentName, nameToStore);
          if (parentName === 'global' || typeof value === 'number') {
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
          candidateGlobs.add(prop);
          if (!candidateModule.has(prop)) {
              candidateModule.set(prop, currentName);
              globalNames.set(prop, prop);
          }
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
    if (lyaConfig.fields.excludes.has(methodNames.get(obj))) {
      return obj;
    }
    counters.total++;
    counters[type]++;
    return new Proxy(obj, handler);
  }
  // We wrap the global variable in a proxy
  const createGlobalPr = () => {
    if (!lyaConfig.context.include.includes('user-globals')) {
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
    if (!lyaConfig.context.include.includes('module-locals')) {
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

  const getValues = (obj) => {
    if (Object.keys(obj).length) {
      return Object.keys(obj);
    } else {
      return Object.getOwnPropertyNames(obj);
    }
  };

  // We wrap every function on global obj that exists in default-names.json
  // Returns the proxy obj we want
  // TODO: more elegant fix on stopLoops
  let stopLoops;
  const proxyWrap = function(obj, handler, name, depth) {
    if (depth === 0 || obj === null || stopLoops.has(obj)) {
      return obj;
    };
    depth--;
    const type = typeof obj;
    let localObj = {};
    if (type === 'function') {
      if (clonedFunctions.has(name)) {
        localObj = clonedFunctions.get(name);
        stopLoops.set(localObj, true);
        for (const field of getValues(obj)) {
          if (!lyaConfig.fields.excludes.has(field)) {
            const saveName = name + '.' + field;
            localObj[field] = proxyWrap(obj[field], handler, saveName, depth);
          } else {
            localObj[field] = obj[field];
          };
        };
        localObj = uniqueWrap(localObj, handler, name, type);
      } else {
        stopLoops.set(obj, true);
        localObj = uniqueWrap(obj, handler, name, type);
      }
    } else if (type === 'object') {
      stopLoops.set(obj, true);
      for (const field of getValues(obj)) {
        if (!lyaConfig.fields.excludes.has(field)) {
          const saveName = name + '.' + field;
          localObj[field] = proxyWrap(obj[field], handler,
            saveName, depth);
        };
      };
      localObj = uniqueWrap(localObj, handler, name, type);
    } else if (type === 'number' || type === 'string') {
      localObj = obj;
      globalNames.set(obj, name);
    } else {
      localObj = obj;
    };

    return localObj;
  }

  const createGlobal = (name) => {
    if (global[name] !== undefined) {
      if (!lyaConfig.context.include.includes('node-globals')) {
        return global[name];
      }
      const depth = lyaConfig.depth;
      stopLoops = new WeakMap();
      const proxyObj = proxyWrap(global[name], createHandler('node-globals'),
        name, depth);
      if (name !== 'Infinity' && name!== 'NaN') {
        objectPath.set(proxyObj, moduleName[env.requireLevel]);
      }
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
    prologue = 'let global = localGlobal["proxyGlobal"]\n' + prologue;
    prologue = lyaConfig.context.enableWith ? 'with (withGlobal) {\n' + prologue
      : prologue;
    return prologue;
  };

  // The first time this runs we create the decl
  const getPrologue = () => {
    if (prologue !== '') {
      return prologue;
    }
    generateGlobals();
    cloneFunctions();
    return setPrologue();
  };

  // User can remove things from json file that create conf
  const flattenAndSkip = (groups, under) => {
    groups.filter((e) => {
      lyaConfig.context.excludes.indexOf(e)
    }).forEach((e) => {
      for (const v in defaultNames[under][e]) {
        if (!lyaConfig.context.excludes.indexOf(v)) {
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
        !lyaConfig.context.excludes.includes(e));
    }
    return group;
  };

  const getClone = (obj, name) => {
    let _obj;
    _obj = function (...args) {
      if (new.target) {
        return new obj(...args);
      } else {
        return obj.call(this, ...args);
      }
    };

    Object.defineProperty(_obj, 'name', {value: name});
    return _obj;
  };

  const cloneFunctions = () => {
    for (topClass in defaultNames.globals) {
      defaultNames.globals[topClass].filter((e) => {
        if (typeof global[e] === 'function' && e !== 'Promise') {
          return e;
        };}).forEach((e) => {
          clonedFunctions.set(e, getClone(global[e], e));
      });
    };
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
  let originalScript;
  Module.wrap = (script) => {
    if (lyaConfig.modules.include) {
      originalScript = originalWrap(script);
    };

    script = policy.sourceTransform ? policy.sourceTransform(source, moduleId) :
      script;
    script = lyaConfig.context.enableWith ? getPrologue() + script + '\n}' :
      getPrologue() + script;
    const wrappedScript = originalWrap(script).replace('dirname)',
      'dirname, localGlobal, withGlobal)');

    return wrappedScript;
  };

  // We export the name of the curr module and pass proxy to the final function
  vm.runInThisContext = function(code, options) {
    if (lyaConfig.printCode) {
      console.log('Module: ', options['filename']);
      console.log(code);
    }

    if (lyaConfig.modules.include!== null &&
      !lyaConfig.modules.include.includes(options['filename'])){
      if (env.requireLevel !== 0) {
        env.requireLevel++;
        moduleName[env.requireLevel] = options['filename'];
      }
      return originalRun(originalScript, options);
    }

    env.requireLevel++;
    moduleName[env.requireLevel] = options['filename'];
    const codeToRun = originalRun(code, options);
    if (!Object.prototype.hasOwnProperty.
        call(analysisResult, moduleName[env.requireLevel])) {
      analysisResult[moduleName[env.requireLevel]] = {};
    }
    return setProxy(codeToRun, handlerAddArg, 'object');
  };

  const reduceLevel = (name) => {
    if (env.requireLevel !== 0 &&
      nativeModules.indexOf(name) === -1) {
      env.requireLevel--;
    }
  }

  // We wrap the result in the wrapper function and we use passName
  // to pass the module id to Module.wrap
  let moduleId;
  Module.prototype.require = function(...args) {
    const importName = args[0];
    moduleId = importName;

    if (lyaConfig.modules.include !== null &&
      !lyaConfig.modules.include.includes(moduleName[env.requireLevel])) {
      let moduleExports = originalRequire.apply(this, args);
      reduceLevel(importName);
      return moduleExports;
    };

    let moduleExports = originalRequire.apply(this, args);
    const type = typeof moduleExports;

    if (type !== 'boolean' && type !== 'symbol' &&
          type !== 'number' && type !== 'string') {
      if (!objectName.has(moduleExports)) {
        objectName.set(moduleExports, 'require(\'' + importName + '\')');
        objectPath.set(moduleExports, moduleName[env.requireLevel]);
        if (lyaConfig.context.include.includes('module-returns')) {
          moduleExports = setProxy(moduleExports, exportHandler, type);
        };
        reduceLevel(importName);
      } else {
        moduleExports = setProxy(moduleExports, exportHandler, type);
        objectName.set(moduleExports, 'require(\'' + importName + '\')');
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
            if (lyaConfig.fields.excludes.has(name)) {
              policy.onRead(target, name, parentName, currModule);
              return Reflect.get(...arguments);
            };
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

  const intersection = (setA, setB) => {
      let _intersection = new Set();
      for (let elem of setB) {
          if (setA.has(elem)) {
              _intersection.add(elem);
          }
      }
      return _intersection
  }

  process.on('exit', function() {
    // First, check if the current analysis has set an exit handler;
    // if yes, invoke it, without any parameters: the current analysis has
    // access to the lya config and can decide what to do
    if (policy.onExit) {
      const globalSet = new Set(Object.keys(global));
      policy.onExit(intersection(globalSet, candidateGlobs), candidateModule);
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
    if (!fs.existsSync(conf.analysis)) {
      console.error('Analysis file not found: ', conf.analysis);
      console.error('Exiting..');
      process.exit();
    }
    // TODO: maybe exapand to a local
    // TODO: create a function that assigns default values to the config
    // TODO: Fix this part!!!!
    conf.context = conf.context ? conf.context :
      systemPreset.CONTEXT;
    conf.context.enableWith = conf.context.enableWith !== undefined ?
      conf.context.enableWith : systemPreset.CONTEXT.enableWith;
    conf.context.include = conf.context.excludes ? systemPreset.CONTEXT.include.filter((e) =>
      !conf.context.excludes.includes(e)) : systemPreset.CONTEXT.include;
    conf.context.excludes = conf.context.excludes ? conf.context.excludes : [];
    conf.fields = conf.fields ? conf.fields : systemPreset.FIELDS;
    conf.modules = conf.modules ? conf.modules : systemPreset.MODULES;
    conf.inputString = conf.inputString === false ? conf.inputString:
      systemPreset.INPUT_STRING;
    conf.printCode = conf.printCode ? conf.printCode :
      systemPreset.PRINT_CODE;
    conf.depth = conf.depth ? conf.depth : systemPreset.DEPTH;
    return lyaStartUp(origRequire, conf);
  },
};
