// Programatically monitor module-level interactions.

const state = require('./state.js');


module.exports = {
  callWithLya,
  createLyaState: state.createLyaState,
  preset: require('./config.js').preset,
};


///////////////////////////////////////////////////////////////////////////////

const fs = require('fs');
const Module = require('module');

const {callWithOwnValues} = require('./container-type.js');

const {
  createProxyHandlerObject,
  createProxyApplyHandler,
  maybeAddProxy,
  maybeProxyProperty,
  createHookedRequireProxy,
} = require('./proxy.js');

const {
  IDENTIFIER_CLASSIFICATIONS,
} = require('./taxonomy.js');


// You can place any functions of the same signature as this one here.
// Each function mutates the global scope, or a module's exports,
// runs a callback, and then restores the original state.
//
// All such functions are centralized here so that users can avoid
// concurrent execution of code that would conflict with callWithLya.
const overrides = [
  callWithModuleOverride,
  callWithGlobalOverride,
];


function callWithLya(env, f) {
  const startAnalysis = () => {
    env.timerStart = process.hrtime();
    return f(createLyaRequireProxy(env));
  };

  const callbackResult = (
    overrides.reduce((cb, override) => () => override(env, cb),
                     startAnalysis)()
  );

  postprocess(env, callbackResult);

  return callbackResult;
}


// We start an analysis using the module resolver because we'll want
// relative paths, etc. to function normally.
function createLyaRequireProxy(env) {
  if (typeof env.config.require !== 'function') {
    throw new Error('env.config.require is not a function.');
  }

  const baseApply = createProxyApplyHandler(env, IDENTIFIER_CLASSIFICATIONS.MODULE_LOCALS);

  return maybeAddProxy(env, env.config.require, {
    apply: function () {
      state.setCurrentModule(env, require.main);
      env.metadata.set(env.config.require, { parent: require.main });
      return baseApply(...arguments);
    },
  });
}

const hrTimeToMs = (hrtime) => (hrtime[0] * 1e9) + hrtime[1] / 1e6;

function postprocess(env, callbackResult) {
  // Post-processing
  const {
    results,
    config: {
      print,
      reportTime,
      saveResults,
      hooks: {
        onExit,
      },
    },
  } = env;

  const stringifiedResults = JSON.stringify(results, null, 2);

  onExit(env, {
    value: callbackResult,
    saveIfAble: () => {
      if (saveResults) {
        fs.writeFileSync(saveResults, stringifiedResults, 'utf-8');
      }
    },
    printIfAble: () => {
      if (print) {
        console.log(stringifiedResults);
      }
    },
    reportTimeIfAble: () => {
      if (reportTime) {
        env.timerEnd = process.hrtime(env.timerStart);
        console.log('Time %sms', hrTimeToMs(env.timerEnd));
      }
    },
  })
}


function callWithGlobalOverride(env, f) {
  try {
    global.__lya = {
      cjsApply: cjsApply.bind(null, env),
      globalProxy: maybeAddProxy(
        env,
        global,
        createProxyHandlerObject(
          env, IDENTIFIER_CLASSIFICATIONS.NODE_GLOBALS)),
    };
    const r = f();
    delete global.__lya;
    return r;
  } catch (e) {
    delete global.__lya;
    throw e;
  }
}

/*
A template for a CommonJS module that wraps another.  The intent is to
control global- and module-level bindings (because hacking around
vm.runIn* is a nightmare).

Invariant: __lya exists in the global scope.
*/
const INSTRUMENTED_MODULE = `
(function lya_inGlobalShadow(global, __this, __cjsApply, __cjsArgs) {
$GLOBAL_SHADOWS
  return __cjsApply($USER_CJS, __this, __cjsArgs);
})(__lya.globalProxy, this, __lya.cjsApply, arguments);
`;

function callWithModuleOverride(env, f) {
  return callWithOwnValues(Module, {wrap: overrideModuleWrap(env)}, f);
}


// The strings used to wrap modules are cached using a closure.  If
// you want to use a different configuration, then call
// overrideModuleWrap() with different property values.
//
const originalWrap = Module.wrap.bind(Module);

function overrideModuleWrap(env) {
  const { hooks: { sourceTransform }, fields } = env.config;

  return function wrap(script) {
    // Some input code uses shebangs. Comment them out instead of
    // deleting them, for transparency reasons.
    const noShebang = script.replace(/^\s*#!/, '//#!');

    // Allow the user to replace the code, then wrap it normally.
    const userTransform = sourceTransform(noShebang, null);

    const wrapped = originalWrap(userTransform);

    // We wrap the module again, such that Lya controls the outer
    // module and therefore the user's module.
    const out = originalWrap(
      INSTRUMENTED_MODULE
        .replace('$GLOBAL_SHADOWS',
                 () => Object
                 .getOwnPropertyNames(global)
                 .filter((n) => n !== 'global' && state.inScopeOfAnalysis(fields, n))
                 .map((n) => `  var ${n}=global['${n}'];`)
                 .join('\n'))
        .replace('$USER_CJS',
                 () => (wrapped[wrapped.length - 1] === ';'
                        ? wrapped.slice(0, -1)
                        : wrapped)));

    env.enableHooks = false;
    return out;
  };
}

// Applies a CommonJS module function. Lya takes this chance to hook
// into inter-module activity.
function cjsApply(env, cjsFn, thisArg, cjsArgs) {
  const { config: { context, modules }, currentModule: priorModule } = env;

  // eslint-disable-next-line no-unused-vars
  const [exports, require, module, __filename, __dirname] = cjsArgs;
  const typeClass = IDENTIFIER_CLASSIFICATIONS.NODE_MODULE_LOCALS;

  env.enableHooks = false;

  state.setCurrentModule(env, module);

  const userWantsAProxy = (
    state.inScopeOfAnalysis(context, typeClass) &&
    state.inScopeOfAnalysis(modules, env.currentModuleName)
  );

  const moduleToPass = (userWantsAProxy)
        ? maybeAddProxy(env, module, createProxyHandlerObject(env, typeClass))
        : module;

  const argsToPass = [
    moduleToPass.exports,
    createHookedRequireProxy(env, module, require),
    moduleToPass,
    __filename,
    __dirname,
  ];

  env.enableHooks = true;
  const value = cjsFn.apply(thisArg, argsToPass);
  env.enableHooks = false;

  moduleToPass.exports = (userWantsAProxy)
    ? maybeProxyProperty(env, moduleToPass, 'exports') || moduleToPass.exports
    : moduleToPass.exports;

  state.setCurrentModule(env, priorModule);

  return value;
}
