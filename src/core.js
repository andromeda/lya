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
  preset: require('./config.js').preset,
};


// /////////////////////////////////////////////////////////////////////////////
// Implementation

const {analyze} = require('./analyze.js');
const {assert, assertDeepEqual, test} = require('./test.js');
const {identity} = require('./functions.js');
const {callWithOwnValues, coerceMap, elementOf} = require('./container-type.js');
const {callWithModuleOverride} = require('./module-override.js');
const {callWithVmOverride} = require('./vm-override.js');
const {maybeAddProxy, createProxyApplyHandler} = require('./proxy.js');
const {IDENTIFIER_CLASSIFICATIONS} = require('./constants.js');
const {createReferenceMetadataStore} = require('./metadata.js');
const {configureLya, inTermsOf} = require('./config.js');


// Creates an object used to collect facts from the runtime.
function createLyaState(...configs) {
  return {
    // Contains hooks, policy info, and other user-specific goodies.
    config: configureLya(...configs),

    // Contains metadata collected for references as they are found.
    metadata: createReferenceMetadataStore(),

    // Track dependency relationships
    currentModuleRequest: null,
    moduleName: [],
    requireLevel: 0,

    // For collecting user-defined data.
    results: {},
  };
}


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

const hrTimeToMs = (hrtime) => (hrtime[0] * 1e9) + hrtime[1] / 1e6;

function callWithLya(env, f) {
  const startAnalysis = () => {
    env.timerStart = process.hrtime();
    return f(createLyaRequireProxy(env));
  };

  const callbackResult = (
    overrides.reduce((cb, override) => () => override(env, cb),
                     startAnalysis)()
  );

  // Post-processing
  const {
    results,
    config: {
      saveResults,
      print,
      reportTime,
    },
  } = env;

  const stringifiedResults = JSON.stringify(results, null, 2);

  if (saveResults) {
    fs.writeFileSync(saveResults, stringifiedResults, 'utf-8');
  }

  if (print) {
    console.log(stringifiedResults);
  }

  if (reportTime) {
    env.timerEnd = process.hrtime(env.timerStart);
    console.log('Time %sms', hrTimeToMs(env.timerEnd));
  }

  return callbackResult;
}


// We start an analysis using the module resolver because we'll want
// relative paths, etc. to function as CommonJS expects.
function createLyaRequireProxy(env) {
  if (typeof env.config.require !== 'function') {
    throw new Error('env.config.require is not a function.');
  }

  return maybeAddProxy(env, env.config.require, {
    apply: createProxyApplyHandler(env, IDENTIFIER_CLASSIFICATIONS.MODULE_LOCALS),
  });
}
