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
      // We base the VM context on the same proxy of the Node.js
      // global object so that we can monitor global interactions
      // without messing with how CommonJS works.
      if (!env.context) {
        const handler = createProxyHandlerObject(
          env, IDENTIFIER_CLASSIFICATIONS.NODE_GLOBALS);
        env.context = vm.createContext(maybeAddProxy(env, global, handler));
      }

      const commonJsFunction = vm.runInContext(code, env.context, options);
      env.metadata.set(commonJsFunction, { parent: env.context });

      return maybeAddProxy(env, commonJsFunction, { apply: createCommonJsApply(env) });
    },
  }, f);
}


function createCommonJsApply(env) {
  const handler = createProxyHandlerObject(
    env, IDENTIFIER_CLASSIFICATIONS.MODULE_LOCALS);

  const wrap = (o) => maybeAddProxy(env, o, handler);

  return function apply(target, thisArg, A) {
    const [exports, require, module, __filename, __dirname] = A;
    const moduleId = path.resolve(__dirname, __filename);

    env.currentModule = module;

    env.metadata.set(exports, {
      parent: module,
      name: `require(${moduleId})`,
    });

    env.metadata.set(require, {
      parent: module,
      name: 'require',
    });

    env.metadata.set(module, {
      parent: global,
      name: moduleId,
    });

    A[0] = wrap(exports);
    A[1] = wrap(require);
    A[2] = wrap(module);

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
