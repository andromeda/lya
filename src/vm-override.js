// Override the built-in 'vm' module such that we can monitor
// interactions with CommonJS.

module.exports = {
  callWithVmOverride,
};

const vm = require('vm');
const path = require('path');

const {assert, test} = require('./test.js');
const {maybeAddProxy, createProxyHandlerObject} = require('./proxy.js');
const {callWithOwnValues} = require('./container-type.js');
const {IDENTIFIER_CLASSIFICATIONS} = require('./constants.js');
const {setCurrentModule, inScopeOfAnalysis} = require('./state.js');

// require() calls runInThisContext() as a side-effect. Take that
// chance to inject a smart proxy of the global object.
function callWithVmOverride(env, f) {
  return callWithOwnValues(vm, {
    runInThisContext: function runInThisContext(code, options) {
      if (!env.context) installMockGlobal(env);

      const commonJsFunction = vm.runInContext(code, env.context, options);

      return maybeAddProxy(env, commonJsFunction, { apply: createCommonJsApply(env) });
    },
  }, f);
}

// We base the VM context on the same proxy of the Node.js global
// object. That way we can monitor global interactions without messing
// with how CommonJS works.
function installMockGlobal(env) {
  const handler = createProxyHandlerObject(
    env, IDENTIFIER_CLASSIFICATIONS.NODE_GLOBALS);

  const mockGlobal = Object.getOwnPropertyNames(global).reduce(
    (mock, name) => {
      return Object.assign(mock, {
        [name]: (env.metadata.get(global[name], () => false))
          ? maybeAddProxy(env, global[name], handler)
          : global[name],
      });
    }, {});


  // These need to be untainted in the inner context.
  // eval needs lexical info, and `Function` is sensitive
  // to the type of `this` for the sake of .toString()
  delete mockGlobal.eval;
  delete mockGlobal.Function;

  env.context = vm.createContext(mockGlobal);

  // Captures operations prefixed with 'global.*' like `global.x = 1;
  // This triggers the proxy, so we use a flag to ignore this
  // particular assignment for the hooks.
  env._noop_set = true;
  env.context.global = env.context;
}


function createCommonJsApply(env) {
  const handler = createProxyHandlerObject(
    env, IDENTIFIER_CLASSIFICATIONS.MODULE_LOCALS);

  const wrap = (o) => maybeAddProxy(env, o, handler);

  return function apply(target, thisArg, A) {
    const [exports, require, module, __filename, __dirname] = A;
    const moduleId = path.resolve(__dirname, __filename);

    setCurrentModule(env, module);

    env.metadata.set(exports, {
      parent: module,
      name: `require('${moduleId}')`,
    });

    env.metadata.set(require, {
      parent: module,
      name: 'require',
    });

    if (inScopeOfAnalysis(env.config.modules, moduleId)) {
      A[0] = wrap(exports);
      A[1] = wrap(require);
      A[2] = wrap(module);
    }

    return Reflect.apply(...arguments);
  }
}

test(() => {
  const fs = require('fs');
  const original = vm.runInThisContext;
  const { createLyaState } = require('./state.js');
  const env = createLyaState();
  const dummy = './_test.js';

  fs.writeFileSync(dummy, 'x = "Hi"', { flag: 'w+' });

  try {
    callWithVmOverride(env, () => {
      assert(vm.runInThisContext !== original,
             'Override vm.runInThisContext');

      assert(env.context === undefined,
             'Start with no global.');

      require(dummy);

      assert(env.context,
             'Install global object.');
    });
  } finally {
    fs.unlinkSync(dummy);
  }
});
