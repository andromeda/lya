// Responsible for overriding the behavior of require('module') while
// control remains in a callback.

module.exports = {
  callWithModuleOverride,
};


function callWithModuleOverride(env, f) {
    const prototypePatch = {
        require: overrideModuleRequirePrototype(env),
    };

    const moduleApiPatch = {
        wrap: overrideModuleWrap(env),
        _load: overrideModuleLoad(env),
    };

    // Module.prototype is non-configurable, so we modify it in a
    // separate descriptor override.
    return callWithOwnValues(Module.prototype, prototypePatch,
                             () => callWithOwnValues(Module, moduleApiPatch, f));
}


const Module = require('module');

const {callWithOwnValues, elementOf} = require('./container-type.js');
const {identity} = require('./functions.js');
const {assert, assertDeepEqual, test} = require('./test.js');

const {
  COMMONJS_MODULE_IDENTIFIERS,
  IDENTIFIER_CLASSIFICATIONS,
  NATIVE_MODULES,
  NEGLIGIBLE_EXPORT_TYPES,
} = require('./constants.js');


// The strings used to wrap modules are cached using a closure.
// If you want to use a different `enableWith` configuration, then
// call overrideModuleWrap() with different property values.
//
// Limitation: User code cannot shadow injected identifiers using `let`.
// https://github.com/andromeda/lya/issues/4
//
const originalWrap = Module.wrap;

function overrideModuleWrap(transform = identity) {
  return (script) => originalWrap(transform(script, env.currentModuleRequest));
}


//
// TODO: Clarify why we hook into _load(). Because require() might
// have a cache hit?
//
const originalLoad = Module._load;

function overrideModuleLoad(env) {
  return function _load(...args) {
    env.config.hooks.onImport({
      caller: env.metadata.get(env.currentModule).name,
      callee: Module._resolveFilename.call(this, ...args),
      name: args[0],
    });

    return originalLoad(...args);
  };
}


test(() => {
  const path = require('path');

  overrideModuleLoad({
    requireLevel: 2,
    moduleName: [
      'foo.js',
      'bar.js',
      'baz.js',
    ],
    config: {
      hooks: {
        onImport: ({caller, callee, name}) => {
          assert(name === './module-override.js' &&
                 caller == 'baz.js' &&
                 path.isAbsolute(callee),
                 'onImport hook monitors Module._load');
        },
      },
    },
  })('./module-override.js');
});


const originalProtoRequire = Module.prototype.require;


function createModuleExportProxyHandler(env) {
  const typeClass = IDENTIFIER_CLASSIFICATIONS.MODULE_RETURNS;

  return {
    apply: createProxyApplyHandler(env, typeClass),
    get: createProxyGetHandler(env, typeClass),
    set: createProxySetHandler(env, typeClass),
  };
}

// This is the flip side of a coin, and the other side of that coin is
// vm.runInThisContext. When a module under analysis calls its
// require() function, it will come here. We pass control to our
// overridden vm.runInThisContext by using the original require() for
// the module, and then intercept the module's exports here.
function overrideModuleRequirePrototype(env) {
  return function require(...args) {
    const {
      results,
      metadata,
      currentModule,
      config: {
        modules: {
          include,
          exclude,
        },
      },
    } = env;

    const importName = env.currentModuleRequest = args[0];

    // We might not return exactly this. Since Lya
    // monitors inter-module activity, we may return
    // the proxy instead.
    const actualModuleExports = originalProtoRequire.apply(this, args);
    const moduleExportType = typeof moduleExports;
    const { name: currentModuleName } = metadata.get(currentModule);

    const moduleIncluded = elementOf(include, currentModuleName);
    const moduleExcluded = elementOf(exclude, currentModuleName);
    const exportsKnown = metadata.get(actualModuleExports).name;
    const exportsNegligible = elementOf(NEGLIGIBLE_EXPORT_TYPES, moduleExportType);
    const shouldUseProxy = (
      exportsKnown ||
      elementOf(include, IDENTIFIER_CLASSIFICATIONS.MODULE_RETURNS)
    );

    const baseExportsName = `require('${importName}')`;

    metadata.set(actualModuleExports, {
      parent: currentModule,
      name: (moduleExportType === 'function' && actualModuleExports.name !== '')
        ? baseExportsName + '.' + actualModuleExports.name
        : baseExportsName
    });

    if (shouldUseProxy) {
      return maybeAddProxy(env,
                           actualModuleExports,
                           createModuleExportProxyHandler(env));
    } else {
      return actualModuleExports;
    }
  };
}


function getGlobalNames(globals) {
  return Object
      .keys(globals)
      .reduce((reduction, key) =>
        reduction.concat(globals[key]), [])
      .sort(); // <-- for determinism
}

test(() => {
  const names = getGlobalNames({
    es: [
      'Array',
      'BigInt',
    ],
    node: [
      'console',
      'process',
    ],
  });

  assertDeepEqual(names, ['Array', 'BigInt', 'console', 'process'],
      'Extract global identifiers from dataset');
});
