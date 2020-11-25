/* eslint prefer-rest-params: "off", no-global-assign: "off",
no-shadow-restricted-names: "off" */

const nativeModules = Object.keys(process.binding('natives'));
const Module = require('module');
const vm = require('vm');
// const utils = require('./utils.js');
const config = require('./utils/config.js');

const lyaStartUp = (callerRequire, lyaConfig) => {
  // All the necessary modules for swap
  const originalWrap = Module.wrap;
  const originalRequire = Module.prototype.require;
  const originalRun = vm.runInThisContext;
  const originalFilename = Module._resolveFilename;
  const originalLoad = Module._load;

  const moduleName = [];
  const requireLevel = 0;
  const analysisResult = {};

  // A set of arguments that keeps lya from breaking
  let safetyValve = ['toString', 'valueOf', 'prototype', 'name', 'children'];

  // This holds the string of the transformations inside modules
  const declaration = (lyaConfig.enableWith === false) ? 'var' : 'let';
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
    }
    return _excludes;
  };
  safetyValve = makeExcludes(safetyValve);

  // The counter for the wrapped objects and functions
  const counters = {
    total: 0,
    objects: 0,
    functions: 0,
  };

  // We read and store the data of the json file
  const defaultNames = require('./utils/default-names.json');

  // Returns the objects name
  const getObjectInfo = (obj) => {
    const objName = objectName.has(obj) ? objectName.get(obj) :
      methodNames.has(obj) ? methodNames.get(obj) :
      globalNames.has(obj.name) ? globalNames.get(obj.name) :
      (obj.name) ? obj.name :
      null;
    const objPath = objectPath.has(obj) ? objectPath.get(obj) :
      null;
    // TODO: Add more info...?
    return {
      name: objName,
      path: objPath,
    };
  };

  const conditionCheck = (name, check, condition) => {
    if (check !== null) {
      if (check !== undefined) {
        if (check.includes(name) === condition) {
          return true;
        }
      }
    }

    return false;
  };

  // We make a test on fragment
  const env = {
    conf: lyaConfig,
    moduleName: moduleName,
    requireLevel: requireLevel,
    analysisResult: analysisResult,
    getObjectInfo: getObjectInfo,
    counters: counters,
  };

  // Check that a hook is declared in the analysis
  const hookCheck = (hook, ...args) => {
    if (hook !== undefined) {
      return hook.call(this, ...args);
    }
  };

  // user-globals: e.g., global.x, x,
  // node-globals: console, setImmediate,
  // module-locals: exports, require, module, __filename, __dirname
  // module-returns: exports, module.exports
  // One create handler to rule them all
  // TODO: Add option to return specific handlers,
  // only get,set or only apply etc..
  const createHandler = (moduleClass) => {
    return {
      apply: function(target, thisArg, argumentsList) {
        let result;
        const currentName = objectPath.get(target);
        const birthplace = objectName.has(target) ?
          objectName.get(target) : null;
        const birthName = birthplace + '.' + target.name;
        const currentModule = moduleName[env.requireLevel];
        const origReqModuleName = argumentsList[0];

        const nameToStore =
          (target.name === 'require') ? 'require(\'' +
            origReqModuleName + '\')' :
          methodNames.has(target) ? methodNames.get(target) :
          (birthplace && (currentModule === currentName)) ? birthName :
          null;

        if (nameToStore) {
          const newTarget = hookCheck(policy.onCallPre, {
            target: target,
            thisArg: thisArg,
            argumentsList: argumentsList,
            name: target.name,
            nameToStore: nameToStore,
            currentModule: currentModule,
            declareModule: currentName,
            typeClass: moduleClass});

          if (newTarget) {
            target = newTarget;
            return Reflect.apply(...arguments);
          }
        }

        // In case the target is not a pure function Reflect doesnt work
        // for example: in native modules
        try {
          result = Reflect.apply(...arguments);
        } catch (e) {
          result = target(...argumentsList);
        }

        if (nameToStore) {
          hookCheck(policy.onCallPost, {
            target: target,
            thisArg: thisArg,
            argumentsList: argumentsList,
            name: target.name,
            nameToStore: nameToStore,
            currentModule: currentModule,
            declareModule: currentName,
            typeClass: moduleClass,
            result: result});
        }

        return result;
      },
      get: function(target, name) {
        const currentModule = objectPath.get(target);
        const storeName = globalNames.has(name) ? globalNames.get(name) :
          globalNames.has(target[name]) ? globalNames.get(target[name]) :
          methodNames.has(target[name]) ? methodNames.get(target[name]) :
          methodNames.has(target) ? methodNames.get(target) :
          null;

        if (storeName && name) {
          hookCheck(policy.onRead, {
            target: target,
            name: name,
            nameToStore: storeName,
            currentModule: currentModule,
            typeClass: moduleClass});
        }

        return Reflect.get(...arguments);
      },
      set: function(target, name, value) {
        const currentModule = objectPath.get(target);
        if (methodNames.has(target)) {
          const parentName = methodNames.get(target);
          const nameToStore = globalNames.has(name) ? globalNames.get(name) :
            parentName + '.' + name;
          hookCheck(policy.onWrite, {
            target: target,
            name: name,
            value: value,
            currentModule: currentModule,
            parentName: parentName,
            nameToStore: nameToStore});
          if (parentName === 'global' || typeof value === 'number') {
            globalNames.set(name, nameToStore);
          }
        }

        return Reflect.set(...arguments);
      },
      has: function(target, prop) {
        const currentName = env.moduleName[env.requireLevel];
        const parentObject = methodNames.get(target);
        const result = Reflect.has(...arguments);
        const nameToStore = parentObject + '.' + prop;
        if (parentObject === 'global' && !result &&
          prop !== 'localGlobal') {
          candidateGlobs.add(prop);
          if (!candidateModule.has(prop)) {
            candidateModule.set(prop, currentName);
            globalNames.set(prop, prop);
          }
          hookCheck(policy.onHas, {
            target: target,
            prop: prop,
            currentName: currentName,
            nameToStore: nameToStore});
        }

        return result;
      },
      construct: function(target, args) {
        const currentName = env.moduleName[env.requireLevel];
        const nameToStore = target.name;
        if (target.name !== 'Proxy') {
          hookCheck(policy.onConstruct, {
            target: target,
            args: args,
            currentName: currentName,
            nameToStore: nameToStore});
        }

        // eslint-disable-next-line new-cap
        return new target(...args);
      },
    };
  };

  // Import the right policy depending on the choice of the user.
  const policy = require(lyaConfig.analysis)(env);

  const setProxy = (obj, handler, type) => {
    if (safetyValve.has(methodNames.get(obj))) {
      return obj;
    }
    counters.total++;
    counters[type]++;
    return new Proxy(obj, handler);
  };
  // We wrap the global variable in a proxy
  const createGlobalPr = () => {
    if (conditionCheck('user-globals', lyaConfig.context.include, false)) {
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
  };

  // TODO: this should come from generate
  const moduleInputNames = defaultNames.locals.node;

  // require, __dirname, __filename
  const wrapModuleInputs = (obj, count) => {
    const type = typeof obj[count];
    let localCopy;
    if (type === 'string') {
      if (lyaConfig.inputString) {
        // eslint-disable-next-line no-new-wrappers
        localCopy = new String(obj[count]);
      } else {
        return obj[count];
      }
    } else {
      localCopy = obj[count];
    }
    methodNames.set(localCopy, moduleInputNames[count]);
    objectPath.set(localCopy, moduleName[env.requireLevel]);
    if (conditionCheck('module-locals', lyaConfig.context.include, false)) {
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
  };

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
    return setProxy(noProxyOrig, handler, type);
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
    }
    depth--;
    const type = typeof obj;
    let localObj = {};
    if (type === 'function') {
      if (clonedFunctions.has(name)) {
        localObj = clonedFunctions.get(name);
        stopLoops.set(localObj, true);
        for (const field of getValues(obj)) {
          if (!safetyValve.has(field)) {
            const saveName = name + '.' + field;
            localObj[field] = proxyWrap(obj[field], handler, saveName, depth);
          } else {
            localObj[field] = obj[field];
          }
        }
        localObj = uniqueWrap(localObj, handler, name, type);
      } else {
        stopLoops.set(obj, true);
        localObj = uniqueWrap(obj, handler, name, type);
      }
    } else if (type === 'object') {
      stopLoops.set(obj, true);
      for (const field of getValues(obj)) {
        if (!safetyValve.has(field)) {
          const saveName = name + '.' + field;
          localObj[field] = proxyWrap(obj[field], handler,
              saveName, depth);
        }
      }
      localObj = uniqueWrap(localObj, handler, name, type);
    } else if (type === 'number' || type === 'string') {
      localObj = obj;
      globalNames.set(obj, name);
    } else {
      localObj = obj;
    }

    return localObj;
  };

  const createGlobal = (name) => {
    if (global[name] !== undefined) {
      if (conditionCheck('node-globals', lyaConfig.context.include, false)) {
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
    prologue += declaration + ' ' + name +
      ' = localGlobal["' + name +'"];\n';
  };

  const passJSONFile = (func, json) => {
    const returnValue = {};
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
    prologue = declaration + ' global = localGlobal["proxyGlobal"]\n' +
      prologue;
    prologue = lyaConfig.enableWith ? 'with (withGlobal) {\n' +
      prologue : prologue;
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
      lyaConfig.fields.excludes.indexOf(e);
    }).forEach((e) => {
      for (const v in defaultNames[under][e]) {
        if (!lyaConfig.fields.excludes.indexOf(v)) {
          defaultNames[under][v] = true;
        }
      }
      // TODO: remove e
      // delete defaultNames[under][e];
    });
  };

  // TODO: Combine with flattenAndSkip
  const skipMe = (group) => {
    if (lyaConfig.fields.include) {
      return [lyaConfig.fields.include];
    }

    for (const v in group) {
      if (Object.prototype.hasOwnProperty.call(group, v)) {
        group[v] = group[v].filter((e) =>
          !lyaConfig.fields.excludes.includes(e));
      }
    }
    return group;
  };

  // We use this function to make each function a unique object
  // We use this in order to create unique keys for WeakMap
  const getClone = (obj, name) => {
    const _obj = function(...args) {
      if (new.target) {
        // eslint-disable-next-line new-cap
        return new obj(...args);
      } else {
        return obj.call(this, ...args);
      }
    };

    Object.defineProperty(_obj, 'name', {value: name});
    return _obj;
  };

  const cloneFunctions = () => {
    for (const topClass in defaultNames.globals) {
      if (Object.prototype.hasOwnProperty.call(defaultNames.globals,
          topClass)) {
        defaultNames.globals[topClass].filter((e) => {
          if (typeof global[e] === 'function' && e !== 'Promise') {
            return e;
          }
        }).forEach((e) => {
          clonedFunctions.set(e, getClone(global[e], e));
        });
      }
    }
  };

  // User can remove things from json file that create conf
  const generateGlobals = () => {
    // flatten globals under defaultNames.globals.*
    flattenAndSkip(['es', 'node', 'other'], 'globals');
    defaultNames.globals = skipMe(defaultNames.globals);
    // flatten locals under defaultNames.locals.*
    flattenAndSkip(['node'], 'locals');
  };

  // extend wrap to take additional argument
  let originalScript;
  Module.wrap = (script) => {
    if (lyaConfig.modules.include || lyaConfig.modules.excludes) {
      originalScript = originalWrap(script);
    }

    if (policy.sourceTransform !== undefined) {
      const returnScript = policy.sourceTransform(script, moduleId);
      if (returnScript !== undefined) {
        script = returnScript;
      }
    }
    script = lyaConfig.enableWith ? getPrologue() + script + '\n}' :
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

    if (conditionCheck(options['filename'], lyaConfig.modules.include, false) ||
    conditionCheck(options['filename'], lyaConfig.modules.excludes, true)) {
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
  };

  // FIXME: the original _load has some special conditions that
  // we need to account for.
  Module._load = function(...args) {
    // We use Module._resolveFilename to find the filename
    // and then attach it to the hook
    const name = args[0];
    const path = originalFilename.call(this, ...args);
    hookCheck(policy.onImport, {
      caller: moduleName[env.requireLevel],
      callee: path,
      name: name});

    return originalLoad.call(this, ...args);
  };

  // We wrap the result in the wrapper function and we use passName
  // to pass the module id to Module.wrap
  const setNamePath = (type, moduleExports, importName) => {
    if (type === 'function' && moduleExports.name !== '') {
      objectName.set(moduleExports, 'require(\'' + importName + '\').' +
        moduleExports.name);
    } else {
      objectName.set(moduleExports, 'require(\'' + importName + '\')');
    }
    objectPath.set(moduleExports, moduleName[env.requireLevel]);
  };

  let moduleId;
  Module.prototype.require = function(...args) {
    if (moduleName[0] === undefined) {
      moduleName[0] = this.filename;
      analysisResult[moduleName[0]] = {};
    }

    const importName = args[0];
    moduleId = importName;
    let moduleExports = originalRequire.apply(this, args);

    if (conditionCheck(moduleName[env.requireLevel],
        lyaConfig.modules.include, false) ||
        conditionCheck(moduleName[env.requireLevel],
            lyaConfig.modules.excludes, true)) {
      reduceLevel(importName);
      return moduleExports;
    }

    const type = typeof moduleExports;

    if (type !== 'boolean' && type !== 'symbol' &&
          type !== 'number' && type !== 'string') {
      if (!objectName.has(moduleExports)) {
        setNamePath(type, moduleExports, importName);
        if (conditionCheck('module-returns', lyaConfig.context.include, true)) {
          moduleExports = setProxy(moduleExports, exportHandler, type);
        }

        reduceLevel(importName);
      } else {
        moduleExports = setProxy(moduleExports, exportHandler, type);
        setNamePath(type, moduleExports, importName);
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
      hookCheck(policy.onCallPre, {
        target: target,
        thisArg: thisArg,
        argumentsList: argumentsList,
        name: target.name,
        nameToStore: nameToStore,
        currentModule: currModule,
        declareModule: declareModule,
        typeClass: 'module-returns'});

      const result = Reflect.apply(...arguments);

      hookCheck(policy.onCallPost, {
        target: target,
        thisArg: thisArg,
        argumentsList: argumentsList,
        name: target.name,
        nameToStore: nameToStore,
        currentModule: currModule,
        declareModule: declareModule,
        typeClass: 'module-returns',
        result: result});

      return result;
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
            hookCheck(policy.onRead, {
              target: target,
              name: name,
              nameToStore: childName,
              currentModule: currModule,
              typeClass: 'module-returns'});
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
            if (conditionCheck('module-returns',
                lyaConfig.context.include, true)) {
              target[name] = setProxy(currFunction, {
                apply: createHandler('module-returns').apply,
              }, exportType);
            }
            storePureFunctions.set(target[name], currFunction);
            if (safetyValve.has(name)) {
              hookCheck(policy.onRead, {
                target: target,
                name: name,
                nameToStore: parentName,
                currentModule: currModule,
                typeClass: 'module-returns'});
              return Reflect.get(...arguments);
            }
            namePathSet(currFunction, parentName, currModule);
            hookCheck(policy.onRead, {
              target: target,
              name: name,
              nameToStore: nameToStore,
              currentModule: currModule,
              typeClass: 'module-returns'});
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
            hookCheck(policy.onRead, {
              target: target,
              name: name,
              nameToStore: nameToStore,
              currentModule: currModule,
              typeClass: 'module-returns'});
            passedOver.set(nameToStore + currModule, true);
          }
        }
      }

      return Reflect.get(...arguments);
    },
    set: function(target, name, value) {
      if (typeof name !== 'symbol') {
        const parentName = objectName.get(target);
        const nameToStore = parentName + '.' + name;
        const currModule = moduleName[env.requireLevel];
        hookCheck(policy.onWrite, {
          target: target,
          name: name,
          value: value,
          currentModule: currModule,
          parentName: parentName,
          nameToStore: nameToStore});
      }
      return Reflect.set(...arguments);
    },
  };

  const intersection = (setA, setB) => {
    const _intersection = new Set();
    for (const elem of setB) {
      if (setA.has(elem)) {
        _intersection.add(elem);
      }
    }
    return _intersection;
  };

  process.on('exit', function() {
    // First, check if the current analysis has set an exit handler;
    // if yes, invoke it, without any parameters: the current analysis has
    // access to the lya config and can decide what to do
    if (policy.onExit) {
      const globalSet = new Set(Object.keys(global));
      policy.onExit(intersection(globalSet, candidateGlobs), candidateModule);
    } else if (env.conf.print) {
      console.log(JSON.stringify(env.analysisResult, null, 2));
    }
  });

  return setProxy(callerRequire, createHandler('module-locals'), 'function');
};

module.exports = {
  preset: config.preset,
  settings: config.settings,
  configRequire: (origRequire, inputConfig) => {
    return lyaStartUp(origRequire, config.update(inputConfig));
  },
};
