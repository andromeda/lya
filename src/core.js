// Programatically monitor module-level interactions.

const state = require('./state.js');


module.exports = {
  analyze,
  callWithLya,
  createLyaState: state.createLyaState,
  preset: require('./config.js').preset,
};


// /////////////////////////////////////////////////////////////////////////////
// Implementation

const fs = require('fs');
const vm = require('vm');
const {coerceString} = require('./string.js');
const {assert, test} = require('./test.js');
const {callWithModuleOverride} = require('./module-override.js');
const {callWithVmOverride} = require('./vm-override.js');
const {maybeAddProxy, createProxyApplyHandler} = require('./proxy.js');
const {IDENTIFIER_CLASSIFICATIONS} = require('./constants.js');


// You can place any functions of the same signature as this one here.
// Each function mutates the global scope, or a module's exports,
// runs a callback, and then restores the original state.
//
// All such functions are centralized here so that users can avoid
// concurrent execution of code that would conflict with callWithLya.
const overrides = [
  callWithModuleOverride,
  callWithVmOverride,
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
// relative paths, etc. to function as CommonJS expects.
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



// Called for its effect
function analyze(env) {
  const {
    entry,
    context: contextVariant,
    config,
  } = env || {};

  const {
    vmContextConfig,
    vmConfig,
  } = config || {};

  const code = coerceString(entry, {allowFileRead: true});

  env.context = vm.isContext(contextVariant)
    ? contextVariant
    : vm.createContext(contextVariant, vmContextConfig);

  env.value = vm.runInContext(code, env.context, vmConfig);

  return env;
}

// Simple use
test(() => {
  const options = {
    entry: 'x = process.exit(x)',
    context: {
      x: 0,
      process: {
        exit: (v) => v + 10,
      },
    },
  };

  const ref = analyze(options);

  assert(ref === options, 'Operate on the input argument');
  assert(ref.context.x === 10, 'JS affects context object');
  assert(ref.value === 10, 'Evaluate to last statement or expression.');

  analyze(options);

  assert(ref.context.x === 20 && ref.context.x === ref.value,
      'Reuse context');
});


// Recursive eval example
test(() => {
  const options = {
    // Expression ultimately means: 2 * 8 + -1 => 14
    entry: 'x = eval("2 * eval(`8 + eval(\'x\')`)")',
    context: {
      eval: (entry) => {
        // Base case is to reference only the global variable.
        if (entry === 'x') {
          return -1;
        } else {
          return analyze(Object.assign({}, options, {entry})).value;
        }
      },
    },
  };

  analyze(options);

  assert(options.context.x === 14 && options.context.x === options.value,
      'Recursively analyze via eval()');
});
