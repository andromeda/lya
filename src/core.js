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
const { createHookedRequireProxy, equip } = require('./proxy.js');


function callWithLya(env, f) {
  return callWithOwnValues(Module, { wrap: overrideModuleWrap(env) }, () => {
    env.timerStart = process.hrtime();
    const result = f();
    postprocess(env, result);
    return result;
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



const originalWrap = Module.wrap.bind(Module);

function overrideModuleWrap(env) {
  const { hooks: { sourceTransform }, fields, enableWith } = env.config;

  return function wrap(script) {
    const commentedOutShebang = script.replace(/^\s*#!/, '//#!');
    const userTransform = sourceTransform(commentedOutShebang, null);
    const withWithWrap = enableWith ? `with (global) {\n${userTransform}\n}` : userTransform;
    const wrapped = originalWrap(withWithWrap);
    const cjsFunctionExpression = wrapped[wrapped.length - 1] === ';' ? wrapped.slice(0, -1) : wrapped;

    const globalShadows =
          Object
          .getOwnPropertyNames(global)
          .filter((n) => n !== 'global' && state.inScopeOfAnalysis(fields, n))
          .map((n) => `  var ${n}=global['${n}'];`)
          .join('\n');

    global.__lya = {
      cjsApply: cjsApply.bind(null, env),
      globalProxy: equip(env, global, IDENTIFIER_CLASSIFICATIONS.NODE_GLOBALS, (e, p) => p),
    };

    const out = originalWrap([
      `(function inGlobalShadow(global, __this, __cjsApply, __cjsArgs) {`,
      globalShadows,
      `  return __cjsApply(${cjsFunctionExpression}, __this, __cjsArgs);`,
      `})(__lya.globalProxy, this, __lya.cjsApply, arguments);`,
    ].join('\n'));

    return out;
  };
}

// Applies a CommonJS module function. Lya takes this chance to hook
// into inter-module activity.
function cjsApply(env, cjsFn, thisArg, cjsArgs) {
  const { config: { context, modules }, currentModule: priorModule } = env;

  // eslint-disable-next-line no-unused-vars
  const [exports, require, module, __filename, __dirname] = cjsArgs;
  const typeClass = IDENTIFIER_CLASSIFICATIONS.CJS_ARGUMENTS;

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
