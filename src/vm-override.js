module.exports = {
  callWithVmOverride,
};

const vm = require('vm');
const {assert, test} = require('./test.js');
const {maybeAddProxy, createProxyHandlerObject} = require('./proxy.js');
const {callWithOwnValues} = require('./container-type.js');
const {IDENTIFIER_CLASSIFICATIONS} = require('./constants.js');

// require() calls runInThisContext() as a side-effect. Take that
// chance to inject a smart proxy of the global object.
function callWithVmOverride(env, f) {
  return callWithOwnValues(vm, {
    runInThisContext: function runInThisContext(code, options) {
      if (!env.context) {
        const handler = createProxyHandlerObject(
          env, IDENTIFIER_CLASSIFICATIONS.NODE_GLOBALS);

        env.context = maybeAddProxy(env, global, handler);
      }

      const commonJsFunction = vm.runInContext(code, env.context, options);
      setParent(env.metadata, commonJsFunction, global);

      return maybeAddProxy(env, commonJsFunction, { apply: createCommonJsApply(env) });
    },
  }, f);
}


function createCommonJsApply(env) {
  const handler = createProxyHandlerObject(
    env, IDENTIFIER_CLASSIFICATIONS.MODULE_LOCALS);

  const wrap = (o) => maybeAddProxy(env, o, handler);
  
  return function apply(target, thisArg, A) {
    // A := [exports, require, module, __filename, __dirname]
    
    A[0] = wrap(A[0]);
    A[1] = wrap(A[1]);
    A[2] = wrap(A[2]);

    setParent(env.metadata, A[2], global);

    return Reflect.apply(...arguments);
  }
}

test(() => {
  const original = vm.runInThisContext;

  const env = {
  };
  
  callWithVmOverride(env, () => {
    assert(vm.runInThisContext !== original,
           'Override vm.runInThisContext');

    assert(env.context === undefined,
           'Start with no global.');

    require('./dummy.js');

    assert(env.context instanceof Proxy,
           'Install Proxy as global object.');    
  });
});
