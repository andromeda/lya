/* eslint prefer-rest-params: "off", no-global-assign: "off",
no-shadow-restricted-names: "off" */

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

  // Import the right policy depending on the choice of the user.
  const policy = require(lyaConfig.analysis)(env);

  // We wrap the global variable in a proxy
  global = new Proxy(global, policy.globalHandler);

  // TODO: this should come from generate
  const moduleInputNames = defaultNames.locals.node;

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

  const setLocalGlobal = () => {
    let localGlobal = {};
    localGlobal = passJSONFile(createGlobal, defaultNames.globals);
    localGlobal['proxyExportHandler'] = policy.globalConstHandler;
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

  const saveName = (obj, name, givenFunc) => methodNames.set(obj[name],
      givenFunc + '.' + name);
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
        nameSave ? saveName(obj, name, givenFunc) : null;
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

  const proxyWrap = function(handler, origGlobal, givenFunc) {
    const objType = typeof origGlobal;
    let localGlobal = {};
    if (objType === 'function') {
      const noProxyOrig = new Proxy(origGlobal, {});
      // methodNames.set(noProxyOrig, givenFunc);
      objPath.set(noProxyOrig, moduleName[env.requireLevel]);
      localGlobal = new Proxy(noProxyOrig, handler);
    } else if (objType === 'object') {
      if (!getObjLength(origGlobal)) {
        const values = getObjValues(origGlobal);
        for (const key in values) {
          if (Object.prototype.hasOwnProperty.call(values, key)) {
            const name = values[key];
            localGlobal[name] = objTypeAction(origGlobal, name, handler,
                givenFunc, true);
          }
        }
      } else {
        for (const key in origGlobal) {
          if (Object.prototype.hasOwnProperty.call(origGlobal, key)) {
            localGlobal[key] = objTypeAction(origGlobal, key, handler,
                givenFunc, false);
          }
        }
      }
    }
    return localGlobal;
  };

  const createGlobal = (name) => {
    if (global[name] !== undefined) {
      return proxyWrap(policy.moduleHandler, global[name], name);
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
    // If false that means that we pass from here for the
    // first time.

    const type = typeof result;
    if (type !== 'boolean' && type !== 'symbol' &&
          type !== 'number' && type !== 'string') {
      if (!objName.has(result)) {
        // Each time we update env we update locEnv too
        objName.set(result, 'require(\'' + path + '\')');
        objPath.set(result, moduleName[env.requireLevel]);
        result = new Proxy(result, exportHandler);
        if (env.requireLevel !== 0) {
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
    get: function(target, name, receiver) {
      const exportType = typeof(target[name]);
      if (exportType !== 'undefined' && target[name] != null &&
          typeof name === 'string' && (!(target[name] instanceof RegExp))) {
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
            const result = Reflect.get(target, name);
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
          const result = Reflect.get(target, name);
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

  // We print all the results at the end of the analysis
  process.on('exit', function() {
    env.end = true;
    if (lyaConfig.SAVE_RESULTS && !/ENFORCEMENT$/.test(lyaConfig.analysis)) {
      fs.writeFileSync(lyaConfig.SAVE_RESULTS,
          JSON.stringify(analysisResult, null, 2), 'utf-8');
    }
  });
  return new Proxy(callerRequire, policy.require);
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
