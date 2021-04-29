// Programatically monitor module-level interactions.

const state = require('./state.js');
const config = require('./config.js');
const {IDENTIFIER_CLASSIFICATIONS} = require('./taxonomy.js');


module.exports = {
  callWithLya,
  createLyaState: state.createLyaState,
  preset: config.preset,
  IDENTIFIER_CLASSIFICATIONS,
};


///////////////////////////////////////////////////////////////////////////////

const fs = require('fs');
const vm = require('vm');
const path = require('path');
const Module = require('module');
const { callWithOwnValues } = require('./container-type.js');
const { createHookedRequireProxy, equip } = require('./proxy.js');
const { ObjectGetOwnPropertyNames } = require('./shim.js');


function callWithLya(env, f) {
  return callWithOwnValues(Module, { wrap: overrideModuleWrap(env) }, () => {
    env.timerStart = process.hrtime();
    try {
      const result = f();
      postprocess(env, result);
      return result;
    } catch (e) {
      env.config.hooks.onError(e);
    }
  });
}


function postprocess(env, callbackResult) {
  // Post-processing
  const { results, config } = env;
  const { print, reportTime, saveResults, hooks: { onExit } } = config;

  const stringifiedResults = JSON.stringify(results, null, 2);

  onExit({
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
          ObjectGetOwnPropertyNames(global)
          .filter((n) => (
              n !== 'global' &&
              state.inScopeOfAnalysis(fields, n) &&
              /^[_a-z][_0-9a-z]$/i.test(n)
          ))
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

  const applyCommonJs = (args) => {
    // Hide from user code
    delete global.__lya;
    return cjsFn.apply(thisArg, args);
  };

  const value = (userWantsAProxy)
        ? equip(env, module, typeClass, (err, proxied) =>
                applyCommonJs([
                  proxied.exports,
                  createHookedRequireProxy(env, proxied, require),
                  proxied,
                  __filename,
                  __dirname,
                ]))
        : applyCommonJs(cjsArgs);

  // Clear queue of deferred functions to handle any concerns that the
  // hooks could not address immediately.
  for (let q = env.queue.shift(); q; q = env.queue.shift()) q();

  state.setCurrentModule(env, priorModule);

  return value;
}


const {
  test,
  assert,
  assertDeepEqual,
  assertAnyError,
  assertNoError,
} = require('./test.js');

////////////////////////////////////////////////////////////////////////////////
// The below tests cover per-module scenarios, and do not propogate
// proxies to dependencies.

// Scenario: Input script is executable and includes a shebang
// Expected behavior: Comment out the shebang so the program does not crash.
test(() => {
  const {module} = scenario('shebang', {
    code: '#!/usr/bin/env node\nmodule.exports={a:1}',
  });

  assert(module.exports.a === 1,
         'CommonJS function works in spite of shebang');
});

// Scenario: User code tries to access Lya's instrumentation
// Expected behavior: User code cannot do so.
test(() => {
  const { module: { exports: { prefixed, unprefixed } } } = scenario('hide __lya', {
    code: `module.exports={
            prefixed: global.__lya,
            unprefixed: (() => {try {return __lya} catch (e) {}})(),
          }`,
  });

  assert(typeof prefixed === 'undefined' &&
         typeof unprefixed === 'undefined',
         'Hide instrumentation from user code');
});

// Scenario: User code accesses global variables with and without 'global.' prefix.
// Expected behavior: We see the accesses either way.
test(() => {
  let count = 0;
  const {
    module: {
      exports: [unprefixed, prefixed],
    },
  } = scenario('global proxy', {
    code: `module.exports = [console.log, global.console.log]`,
    lyaConfig: {
      hooks: {
        onRead: ({ target, name }) => {
          if (target === console && name === 'log') {
            ++count;
          }
        },
      }
    },
  });

  assert(unprefixed !== console.log && prefixed !== console.log,
         'User code does not see the same globals');

  assert(count === 2,
         'Proxies detected global-prefixed access, and unprefixed access');
});


// Scenario: User code uses `eval`, with and without 'global.' prefix.
// Expected behavior: `eval` only works fully when not bound to anything else.
test(() => {
  const makeEvalCode = (id)=>`module.exports = (() => { let a = 1; return ${id}('a'); })()`;

  const enableUnprefixedEvalUsing = id => ({
    code: makeEvalCode(id),
    lyaConfig: {
      fields: {
        exclude: ['eval'],
      },
    },
  });

  assertAnyError(() => {
    scenario('broken eval (unprefixed)', {
      code: makeEvalCode('eval'),
    })
  }, 'eval() breaks when proxied');

  assertAnyError(() => scenario('broken eval (prefixed)',
                                enableUnprefixedEvalUsing('global.eval')),
                 'eval() breaks when proxied via fake global');

  assertNoError(() => scenario('working eval', enableUnprefixedEvalUsing('eval')),
                'eval() works when left be');
});

// Scenario: User requires a module with a side effect and different
// export style.
//
// Expected behavior: Dynamic analysis extends to required
// module, and does not miss monitoring the exports.
test(() => {
  const mainModule = '/tmp/main.js';
  const libModule = '/tmp/dependency.js';
  const relativePath = './_/../dependency.js';

  fs.writeFileSync(libModule, 'global.u = 1; x = 9; exports.a = 1');
  fs.writeFileSync(mainModule, `module.exports = require('${relativePath}').a + global.u`);

  const logs = {
    [mainModule]: {
      reads: [],
      writes: [],
      imports: [],
      checks: [],
    },
    [libModule]: {
      reads: [],
      writes: [],
      imports: [],
      checks: [],
    },
  };

  const hook = key => info => logs[info.currentModule || info.caller][key].push(info);

  const env = state.createLyaState({
    hooks: {
      onImport: hook('imports'),
      onRead: hook('reads'),
      onWrite: hook('writes'),
      onHas: hook('checks'),
    },
  });

  callWithLya(env, () => {
    assert(require(mainModule) === 2,
           'Mock require() works with relative paths');

    assertDeepEqual(logs[mainModule].imports[0], {
      caller: mainModule,
      callee: libModule,
      name: relativePath,
    }, 'Detect imports');

    const mainReadInfo = logs[mainModule].reads.find(({name}) => name === 'a')
    assert(typeof mainReadInfo === 'object' &&
           mainReadInfo.nameToStore === `require('${relativePath}').a`,
           'Detect read from dependent\'s exports object');

    const [mainWriteInfo] = logs[mainModule].writes;
    assert(typeof mainWriteInfo === 'object' &&
           mainWriteInfo.name === 'exports' &&
           mainWriteInfo.nameToStore === 'module.exports' &&
           mainWriteInfo.value === 2,
           'Detect write to main module.exports');

    const [
      libGlobalWriteInfo,
      libExportWriteInfo,
      libUnprefixedGlobalWriteInfo,
    ] = logs[libModule].writes;

    assert(typeof libGlobalWriteInfo === 'object' &&
           libGlobalWriteInfo.name === 'u' &&
           libGlobalWriteInfo.nameToStore === 'u' &&
           libGlobalWriteInfo.value === 1,
           'Detect write to global.u');

    assert(typeof libExportWriteInfo === 'object' &&
           libExportWriteInfo.name === 'a' &&
           libExportWriteInfo.nameToStore === 'exports.a' &&
           libExportWriteInfo.value === 1,
           'Detect write to dependency exports');

    assert(typeof libUnprefixedGlobalWriteInfo === 'object' &&
           libUnprefixedGlobalWriteInfo.name === 'x' &&
           libUnprefixedGlobalWriteInfo.nameToStore === 'x' &&
           libUnprefixedGlobalWriteInfo.value === 9,
           'Detect unprefixed write to global `x`');
  });
});



function scenario(name, {
  lyaConfig = {},
  filename = '/tmp/dummy.js',
  code = '',
  mockRequire = () => {},
}) {
  const env = state.createLyaState(config.configureLya(lyaConfig));
  const wrap = overrideModuleWrap(env);
  const check = (t, m) => assert(t, `${name}: ${m}`);

  check(typeof wrap === 'function' && wrap.length === 1,
       'Create override for Module.wrap');

  check(typeof global.__lya === 'undefined',
        'Start without global instrumentation');

  const wrapped = wrap(code);

  check(typeof global.__lya === 'object' &&
        typeof global.__lya.cjsApply === 'function' &&
        typeof global.__lya.globalProxy === 'object',
        'Create global instrumentation as a side-effect of wrapping');

  const mockModule = new Module();
  mockModule.filename = filename;
  mockModule.parent = module;

  // _resolveFilename will check if the module actually exists.
  fs.writeFileSync(mockModule.filename, code);

  const fn = vm.runInThisContext(wrapped);

  check(typeof fn === 'function' && fn.length === 5,
        'Produce a CommonJS function from wrapped code');

  const value = fn(mockModule.exports,
     mockRequire,
     mockModule,
     path.dirname(mockModule.filename),
     path.basename(mockModule.filename));

  check(typeof global.__lya === 'undefined',
        'End without global instrumentation');

  return {env, module: mockModule, wrapped, value};
}
