// Programatically monitor module-level interactions.

const state = require('./state.js');
const {IDENTIFIER_CLASSIFICATIONS} = require('./taxonomy.js');


module.exports = {
  callWithLya,
  createLyaState: state.createLyaState,
  preset: require('./config.js').preset,
  IDENTIFIER_CLASSIFICATIONS,
};


///////////////////////////////////////////////////////////////////////////////

const fs = require('fs');
const Module = require('module');
const { callWithOwnValues } = require('./container-type.js');
const { createProxyHandlerObject, createHookedRequireProxy, equip } = require('./proxy.js');


function callWithLya(env, f) {
  return callWithOwnValues(Module, { wrap: overrideModuleWrap(env) }, () => {
    env.timerStart = process.hrtime();
    const result = f(createLyaRequireProxy(env));
    postprocess(env, result);
    return result;
  });
}


// We start an analysis using the module resolver because we'll want
// relative paths, etc. to function normally.
function createLyaRequireProxy(env) {
  if (typeof env.config.require !== 'function') {
    throw new Error('env.config.require is not a function.');
  }

  const { apply: baseApply } = createProxyHandlerObject(env, IDENTIFIER_CLASSIFICATIONS.MODULE_LOCALS);

  const handler = {
    apply: function apply() {
      state.setCurrentModule(env, require.main);
      env.open(env.config.require, (e,m) => (m.parent = require.main));
      return baseApply.apply(this, arguments);
    },
  };

  return equip(env, env.config.require, handler, (error, proxied) => {
    if (error) throw error;
    return proxied;
  });
}

function postprocess(env, callbackResult) {
  // Post-processing
  const { results, config } = env;
  const { print, reportTime, saveResults, hooks: { onExit } } = config;

  const stringifiedResults = JSON.stringify(results, null, 2);

  onExit(env, {
    value: callbackResult,
    saveIfAble: () => saveResults && fs.writeFileSync(saveResults, stringifiedResults, 'utf-8'),
    printIfAble: () => print && console.log(stringifiedResults),
    reportTimeIfAble: () => {
      if (reportTime) {
        env.timerEnd = process.hrtime(env.timerStart);
        console.log('Time %sms', (env.timerEnd[0] * 1e9) + env.timerEnd[1] / 1e6);
      }
    },
  })
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


// The strings used to wrap modules are cached using a closure.  If
// you want to use a different configuration, then call
// overrideModuleWrap() with different property values.
//
const originalWrap = Module.wrap.bind(Module);

function overrideModuleWrap(env) {
  const { hooks: { sourceTransform }, fields } = env.config;

  return function wrap(script) {
    const commentedOutShebang = script.replace(/^\s*#!/, '//#!');
    const userTransform = sourceTransform(commentedOutShebang, null);
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
    
    global.__lya = {
      cjsApply: cjsApply.bind(null, env),
      globalProxy: equip(env, global, IDENTIFIER_CLASSIFICATIONS.NODE_GLOBALS, (e, p) => p),
    };
    
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

  state.setCurrentModule(env, module);

  const userWantsAProxy = (
    state.inScopeOfAnalysis(context, typeClass) &&
    state.inScopeOfAnalysis(modules, module.filename)
  );

  const value = (userWantsAProxy)
        ? equip(env, module, typeClass, (err, proxied) => {
          const newArgs = [
            proxied.exports,
            createHookedRequireProxy(env, proxied, require),
            proxied,
            __filename,
            __dirname,
          ];

          delete global.__lya;

          return cjsFn.apply(thisArg, newArgs);
        })
        : cjsFn.apply(thisArg, cjsArgs);
  
  state.setCurrentModule(env, priorModule);

  return value;
}
