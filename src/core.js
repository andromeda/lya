/*
Programatically monitor module-level interactions.

  - State is managed with imperative code for performance reasons. You
    can understand and protect invariants using callWith* functions
    and unit tests.

  - Try to remember to make every function do one thing. If a function
    returns a value AND has a side-effect unrelated to producing that
    value... that's two things.
*/


module.exports = {
  createLyaState,
  callWithLya,
};


// /////////////////////////////////////////////////////////////////////////////
// Implementation

const vm = require('vm');

const {analyze} = require('./analyze.js');
const {assert, assertDeepEqual, test} = require('./test.js');
const {identity} = require('./functions.js');
const {callWithOwnValues, coerceMap, elementOf} = require('./container-type.js');
const {callWithModuleOverride} = require('./module-override.js');
const {maybeAddProxy, createProxyApplyHandler} = require('./proxy.js');
const {IDENTIFIER_CLASSIFICATIONS} = require('./constants.js');

const config = require('./config.js');

const universalGlobal = new Function('return this')();


// /////////////////////////////////////////////////////////////////////////////
// High-level API


// We start an analysis using the module resolver. This means that
// when a require() function is used, it will override shared APIs
// and change how required code behaves.
function createLyaRequireProxy(env) {
  return maybeAddProxy(env, env.require, {
    apply: createProxyApplyHandler(env, IDENTIFIER_CLASSIFICATIONS.MODULE_LOCALS),
  });
}


// Creates an object used to collect facts from the runtime.
function createLyaState(userRequire, config) {
  return {
    candidateGlobs: new Set(),
    candidateModule: new Map(),
    clonedFunctions: new Map(),
    config,
    context: createGlobalProxy(),
    defaultNames: require('./default-names.json'),
    globalNames: new Map(),

    // The last unresolved module name used as an argument to require()
    // in the analyzed program. Used to trace dependency relationships.
    currentModuleRequest: null,

    methodNames: new WeakMap(),
    moduleName: [],
    objectName: new WeakMap(),
    objectPath: new WeakMap(),
    passedOver: new Map(),
    proxies: new Map(),
    objectPath: new WeakMap(),
    require: userRequire,
    requireLevel: 0,
    results: {},
    safetyValve: createSafetyValve(),
    storePureFunctions: new WeakMap(),
    withProxy: new WeakMap(),
  };
}


function createGlobalProxy() {
  return {
  };
}


function callWithVmOverride(env, f) {
  return callWithOwnValues(vm, {
    runInThisContext: function runInThisContext(code, options) {
      return vm.runInContext(code, env.context, options);
    },
  }, f);
}


function callWithLya(env, f) {
  const overrides = [
    callWithModuleOverride,
    callWithVmOverride,
  ];

  return overrides.reduce((cb, override) => () => override(env, cb),
      () => f(createLyaRequireProxy(env)))();
}


const getObjectInfo = (env, obj) => ({
  // TODO: Simplify
  name: (env.objectName.has(obj) ?
           env.objectName.get(obj) :
           (env.methodNames.has(obj) ?
              env.methodNames.get(obj) :
              (env.globalNames.has(obj.name) ?
                 env.globalNames.get(obj.name) :
                 (obj.name ?
                    obj.name :
                    null)))),
  path: env.objectPath.has(obj) ?
        env.objectPath.get(obj) :
        null,
});


function createGlobalVariable(env, name) {
  const {
    objectPath,
    moduleName,
    requireLevel,
    context,
    include,
    depth,
  } = env;

  if (context[name] !== undefined) {
    if (!elementOf(include, 'node-globals')) {
      return universalGlobal[name];
    }

    env.stopLoops = new WeakMap();
    const proxyObj = proxyWrap(context[name],
        createHandler('node-globals'),
        name,
        depth);

    if (name !== 'Infinity' && name !== 'NaN') {
      objectPath.set(proxyObj, moduleName[requireLevel]);
    }

    return proxyObj;
  }
}


function cloneFunctions(globalDefaultNames) {
  return Object
      .keys(globalDefaultNames)
      .reduce((names, k) => names.concat(globals[k]), [])
      .filter((e) => (typeof global[e] === 'function' && e !== 'Promise'))
      .reduce((assoc, e) => assoc.set(e, cloneFunction(global[e], e)), new Map());
}


// require, __dirname, __filename
function wrapModuleInputs(env, obj, count) {
  const {
    inputString,
    context: {
      include,
    },
    methodNames,
    objectPath,
    moduleInputNames,
    moduleName,
    requireLevel,
  } = env;

  const type = typeof obj[count];
  let localCopy;

  if (type === 'string') {
    if (inputString) {
      // eslint-disable-next-line no-new-wrappers
      localCopy = new String(obj[count]);
    } else {
      return obj[count];
    }
  } else {
    localCopy = obj[count];
  }

  methodNames.set(localCopy, moduleInputNames[count]);
  objectPath.set(localCopy, moduleName[requireLevel]);

  if (!elementOf(include, 'module-locals')) {
    return localCopy;
  }

  return maybeAddProxy(
      localCopy,
      filterObject(createHandler('module-locals'), ['apply', 'get', 'set']));
}


function createSafetyValve() {
  return coerceMap(['toString', 'valueOf', 'prototype', 'name', 'children'], {
    weak: false,
    makeValue: () => true,
  });
}
