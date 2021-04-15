// Responsible for creating proxy handlers and functions that monitor
// each possible iteration for a JS object.


module.exports = {
  createProxyApplyHandler,
  createProxyConstructHandler,
  createProxyGetHandler,
  createProxyHandlerObject,
  createProxyHasHandler,
  createProxySetHandler,
  createHookedRequireProxy,
  equip,
};

const {withCatch} = require('./control.js');
const {assert, assertDeepEqual, test} = require('./test.js');
const {IDENTIFIER_CLASSIFICATIONS} = require('./taxonomy.js');
const {
  createLyaState,
  setCurrentModule,
  getReferenceDepth,
  buildAbbreviatedDotPath,
  inferReferenceName,
  inScopeOfAnalysis,
} = require('./state.js');


function equip(env, obj, handlerVariant, cb = (e, p) => { if (e) throw e; return p; }) {
  const [error, { proxy: alreadyMade, name }] = env.open(obj, (e,m) => [e,m]);

  if (error) {
    // Failure to get metadata reference implies incompatibility with
    // Proxy. Reasoning being that if we can't collect data about it,
    // then what is a proxy going to tell us?
    return cb(null, obj);
  } else if (alreadyMade) {
    return cb(null, alreadyMade);
  }

  const proxy = new Proxy(obj,
                          (typeof handlerVariant === 'string'
                           ? createProxyHandlerObject(env, handlerVariant)
                           : handlerVariant))

  env.open(obj, (error, meta) => (meta.proxy = proxy));
  env.open(proxy, (error, meta) => (meta.proxies = name));

  return cb(null, proxy);
}


// User hooks should not fire while Lya is instrumenting a module.
function hook(env, f) {
  return function () {
    return global.__lya || f.apply(null, arguments);
  };
}

// Proxies are only meaningful when modules are under analysis.
function proxyBoundary(env, f) {
  return function () {
    return env.currentModule
      ? f.apply(this, arguments)
      : Reflect[f.name].apply(Reflect, arguments);
  };
}


const _cache = {};
function createProxyHandlerObject(env, typeClass) {
  if (!_cache[env]) {
    _cache[env] = {};
  }

  if (!_cache[env][typeClass]) {
    _cache[env][typeClass] = {
      get: createProxyGetHandler(env, typeClass),
      has: createProxyHasHandler(env, typeClass),
      set: createProxySetHandler(env, typeClass),
      apply: createProxyApplyHandler(env, typeClass),
      construct: createProxyConstructHandler(env, typeClass),
    };
  }

  return _cache[env][typeClass];
}

function createProxyGetHandler(env, typeClass) {
  return proxyBoundary(env, function get(target, name, receiver) {
    const { currentModule, open, config: { hooks: { onRead } } } = env;

    const val = Reflect.get(target, name, receiver);

    return open(target, function handleTargetMetadata(error, targetMetadata) {
      if (error) throw error; // Exceptional case being: The target is an object, but we can't know about it?

      targetMetadata.initialOccurringModule = (
        targetMetadata.initialOccurringModule || env.currentModule
      );

      targetMetadata.name = targetMetadata.name || inferReferenceName(target);

      return open(val, function handleValueMetadata(error, valueMetadata) {
        valueMetadata.parent = val === target ? null : target;
        valueMetadata.name = valueMetadata.name || name.toString();
        valueMetadata.initialOccurringModule = (
          valueMetadata.initialOccurringModule || env.currentModule
        );

        const shouldCreateProxy = shouldProxyTarget(
          env, typeClass, getReferenceDepth(env, val), target, name);

        hook(env, onRead)({
          target,
          name,
          nameToStore: buildAbbreviatedDotPath(env, target, valueMetadata.name),
          currentModule: currentModule.filename,
          typeClass,
        });

        // Lazily extend scope of monitoring.
        if (shouldCreateProxy) {
          const handler = createProxyHandlerObject(
            env, valueMetadata.parent === global
              ? IDENTIFIER_CLASSIFICATIONS.NODE_GLOBALS
              : null)

          return equip(env, val, handler, (err, v) => v);
        }

        return val;
      });
    });
  });
}


function createProxySetHandler(env) {
  return proxyBoundary(env, function set(target, name, value) {
    const { open, currentModule, config: { hooks: { onWrite } } } = env;

    if (target === global && name === 'global') {
      console.log('lya: Ignoring global.global assignment');
      return true;
    }

    return open(target, (error, targetMetadata) => {
      targetMetadata.name = targetMetadata.name || inferReferenceName(target);

      hook(env, onWrite)({
        target,
        name,
        value,
        currentModule: currentModule.filename,
        parentName: open(targetMetadata.parent, (e, m) => m.name),
        nameToStore: buildAbbreviatedDotPath(env, target, name),
      });

      return Reflect.set(target, name, value);
    });
  });
}


function createProxyHasHandler(env) {
  return proxyBoundary(env, function has(target, prop) {
    const { open, currentModule, config: { hooks: { onHas } } } = env;
    const result = Reflect.has(target, prop);

    return open(target, (error, targetMetadata) => {
      targetMetadata.name = targetMetadata.name || inferReferenceName(target);

      hook(env, onHas)({
        target,
        prop,
        currentModule: currentModule.filename,
        nameToStore: buildAbbreviatedDotPath(env, target, prop),
      });

      return result;
    });
  });
}


function createProxyConstructHandler(env) {
  return proxyBoundary(env, function construct(target, args, newTarget) {
    const { currentModule, config: { hooks: { onConstruct } } } = env;

    hook(env, onConstruct)({
      target,
      args,
      currentModule: currentModule.filename,
      nameToStore: buildAbbreviatedDotPath(env, target),
    });

    return Reflect.construct(target, args, newTarget);
  });
}


function createHookedRequireProxy(env, owningModule, require) {
  const typeClass = IDENTIFIER_CLASSIFICATIONS.CJS_EXPORTS;
  const handler = createProxyHandlerObject(env, typeClass);
  const seen = new Set();

  return equip(env, require, {
    apply: function apply(target, thisArg, argumentsList) {
      const { config: { hooks: { onImport } }, open } = env;

      const callee = require.resolve(argumentsList[0]);
      const conventionalName = `require('${argumentsList[0]}')`;
      open(require, (e, m) => { m.name = conventionalName });

      // Fire once per edge in a dependency graph.
      if (!seen.has(callee)) {
        hook(env, onImport)({
          caller: owningModule.filename,
          callee,
          name: argumentsList[0],
        });

        seen.add(callee);
      }

      const exports = handler.apply(target, thisArg, argumentsList);
      return equip(env, exports, handler, (error, exportsToUse) =>
        open(exports, (error, meta) => {
          meta.name = conventionalName;

          return exportsToUse;
        }));
    },
  });
}



function createProxyApplyHandler(env, typeClass) {
  return proxyBoundary(env, function apply(target, thisArg, argumentsList) {
    const { currentModule, open, config } = env;
    const { hooks: { onCallPre, onCallPost } } = config;

    const { initialOccurringModule } = open(target, (e, functionMetadata) => {
      functionMetadata.initialOccurringModule = (
        functionMetadata.initialOccurringModule || env.currentModule
      );

      functionMetadata.name = functionMetadata.name || inferReferenceName(target);

      return functionMetadata;
    });

    const info = {
      target,
      thisArg,
      argumentsList,
      name: target.name,
      nameToStore: buildAbbreviatedDotPath(env, target),
      currentModule: currentModule.filename,
      declareModule: initialOccurringModule.filename,
      typeClass,
    };

    info.target = target = hook(env, onCallPre)(info) || target;

    // Reflect.apply fails for some pure functions, e.g. in native modules
    info.result = withCatch(() => Reflect.apply(target, thisArg, argumentsList),
                            () => target.apply(thisArg, argumentsList));

    hook(env, onCallPost)(info);

    return info.result;
  });
}

test(() => {
  const Module = require('module');

  let preCalled, postCalled;
  const junkThis = {};

  function proxyTarget(a, b, c) {
    return a * b * c;
  }

  const onCallPre = ({
    target,
    thisArg,
    argumentsList,
    name,
    nameToStore,
    currentModule,
    declareModule,
    typeClass,
  }) => {
    preCalled = true;
    assert(target === proxyTarget,
           'Apply the right function');
    assert(thisArg === junkThis,
           'Capture the right value of `this`');
    assertDeepEqual(Array.from(argumentsList), [6, 7, 8],
                    'Capture the right arguments');
    assert(name === 'proxyTarget',
           'Capture the function name')
    assert(nameToStore === 'alias',
           'Capture the analysis-specific alias of the function');
    assert(currentModule === Module._resolveFilename(module.filename),
           'Capture the module ID');
    assert(declareModule === 'D',
           'Capture the declaring module');
    assert(typeClass === 'T',
           'Forward typeClass');
  }

  const onCallPost = ({
    result,
  }) => {
    postCalled = true;

    assert(result === (6 * 7 * 8),
           'Report the functions result');
  }

  const env = createLyaState({
    hooks: {
      onCallPre,
      onCallPost,
    },
  });

  setCurrentModule(env, module);

  env.open(proxyTarget, (e,m) => Object.assign(m, {
    name: 'alias',
    initialOccurringModule: { filename: 'D' },
  }));

  equip(env, proxyTarget, 'T', (error, proxy) => {
    const returned = proxy.apply(junkThis, [6, 7, 8]);

    assert(preCalled && postCalled,
           'Call onCallPre and onCallPost hooks');

    assert(returned === (6 * 7 * 8),
           'Forward the functions result');
  });
});



function shouldProxyTarget(env, typeClass, referenceDepth, target, name) {
  const { config: { depth, context, fields } } = env;

  if (target === global && name === 'global')
    return true;

  const desc = Object.getOwnPropertyDescriptor(target, name);

  const userWantsAProxy = (
    referenceDepth <= depth &&
    inScopeOfAnalysis(context, typeClass) &&
    inScopeOfAnalysis(fields, name)
  );

  // Node.js raises an error when a Proxy hides the true value of
  // non-configurable, and non-writable properties.
  const nodeExpectsActualValue = (desc && !desc.configurable && !desc.writable);

  // Some properties are defined such that they cannot run in the
  // context of our proxies. They are hard to predict in terms of
  // property descriptors, so we make manual exceptions.
  const breaksWhenProxied = [
    'children',
    'name',
    'prototype',
    'valueOf',
    'toString',
  ].indexOf(name) > -1;

  return (
    userWantsAProxy &&
    !nodeExpectsActualValue &&
    !breaksWhenProxied
  );
}
