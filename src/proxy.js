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
const {IDENTIFIER_CLASSIFICATIONS, globalNames} = require('./taxonomy.js');
const {
  createLyaState,
  setCurrentModule,
  getReferenceDepth,
  buildAbbreviatedDotPath,
  inferReferenceName,
  inScopeOfAnalysis,
  findDeclaringModule,
} = require('./state.js');

const {
  ObjectAssign,
  ObjectGetOwnPropertyDescriptor
} = require('./shim.js');

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

  env.config.hooks.onProxy({
    target: obj,
    proxy,
  });

  return cb(null, proxy);
}


// User hooks should not fire while Lya is instrumenting a module.
function hook(env, f) {
  return function hookBoundary() {
    const {nameToStore: name} = arguments[0];

    const isWellKnown = (
      typeof name === 'string' && (
        name === 'module.filename' ||
        name === 'global' ||
        name === 'global.global' ||
        name.match(/Symbol\(/)
      )
    );

    const instrumentationExists = Boolean(global.__lya);

    if (!instrumentationExists && !isWellKnown)
      return f.apply(null, arguments);
  };
}

// Proxies are only meaningful when modules are under analysis.
function proxyBoundary(env, f) {
  return function proxyBoundary() {
    return env.currentModule
      ? f.apply(this, arguments)
      : Reflect[f.name].apply(Reflect, arguments);
  };
}


function createProxyHandlerObject(env, typeClass) {
  return {
    get: createProxyGetHandler(env, typeClass),
    has: createProxyHasHandler(env, typeClass),
    set: createProxySetHandler(env, typeClass),
    apply: createProxyApplyHandler(env, typeClass),
    construct: createProxyConstructHandler(env, typeClass),
  };
}

function createProxyGetHandler(env, typeClass, {
  overrideNameToStore = v => v,
} = {}) {
  return proxyBoundary(env, function get(target, name, receiver) {
    const { currentModule, open, config: { hooks: { onRead } } } = env;

    const val = Reflect.get(target, name, receiver);

    return open(target, function handleTargetMetadata(error, targetMetadata) {
      if (error) throw error; // Exceptional case being: The target is an object, but we can't know about it?

      findDeclaringModule(env, target, targetMetadata);

      targetMetadata.name = targetMetadata.name || inferReferenceName(target);

      return open(val, function handleValueMetadata(error, valueMetadata) {
        valueMetadata.parent = val === target ? null : target;
        valueMetadata.name = valueMetadata.name || name.toString();
        valueMetadata.initialOccurringModule = targetMetadata.initialOccurringModule;

        const shouldCreateProxy = shouldProxyTarget(
          env, typeClass, getReferenceDepth(env, val), target, name);

        hook(env, onRead)({
          target,
          name,
          nameToStore: overrideNameToStore(
            buildAbbreviatedDotPath(env, target, valueMetadata.name)),
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

    const [error, meta] = open(target[name], (error, meta) => [error, meta]);

    return open(target, (_, targetMetadata) => {
      targetMetadata.name = targetMetadata.name || inferReferenceName(target);

      const result = Reflect.set(target, name, value);

      hook(env, onWrite)({
        target,
        name,
        value,
        currentModule: currentModule.filename,
        parentName: open(targetMetadata.parent, (e, m) => m.name),
        nameToStore: buildAbbreviatedDotPath(env, target, name),
      });

      // Preserve metadata across assignments
      if (!error) {
        open(target[name], (error, newMeta) => {
          Object.assign(newMeta, meta, {parent: target});

          // Blow away the old proxy. It will need to be recreated.
          open(newMeta.proxy, (_, meta) => { delete meta.proxies });
          delete newMeta.proxy;
        });
      }

      return result;
    });
  });
}

function createProxyHasHandler(env, typeClass) {
  return proxyBoundary(env, function has(target, prop) {
    const {
      open,
      currentModule,
      config: {
        enableWith,
        hooks: {
          onHas,
          onWrite,
        },
      },
      queue,
    } = env;

    const result = Reflect.has(target, prop);

    return open(target, (error, targetMetadata) => {
      targetMetadata.name = targetMetadata.name || inferReferenceName(target);
      const name = prop.toString()

      hook(env, onHas)({
        target,
        prop,
        currentModule: currentModule.filename,
        nameToStore: buildAbbreviatedDotPath(env, target, name),
      });

      // Special case: unprefixed global accesses are detected here if
      // `enableWith` is on, but we cannot capture those using the
      // set and get handlers.  Trigger onRead and onWrite if there are
      // indicators of user-defined interactions with the global object.
      if (enableWith && target === global) {
        if (result && !globalNames.has(name)) {
          // The property exists in the global object, and does not
          // appear to be a well-known identifier or stringified
          // property name. Count it as a read.

          // TODO: What should the receiver argument be?
          createProxyGetHandler(env, typeClass, {
            overrideNameToStore: v => v.replace(/global\./g, '')
          })(target, prop);
        } else if (!result && name !== 'global') {
          // The property is not in the global object yet.  We can't
          // know at this point if the user intends to write to the
          // global object. Defer drawing that conclusion until later
          // in the analysis. If the property appears then, we know it
          // was because of a write.
          queue.push(() => {
            const itShowedUp = Reflect.has(target, prop);

            if (itShowedUp) {
              open(target, (error, targetMetadata) => {
                targetMetadata.name = targetMetadata.name || inferReferenceName(target);
                const value = target[prop];
                open(value, (error, valueMetadata) => {
                  valueMetadata.name = valueMetadata.name || name;
                  valueMetadata.parent = target;
                  hook(env, onWrite)({
                    target,
                    name,
                    value,
                    currentModule: currentModule.filename,
                    parentName: targetMetadata.name,
                    nameToStore: name
                  });
                });
              });
            }
          });
        }
      }

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
      findDeclaringModule(env, target, functionMetadata);
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

  env.open(proxyTarget, (e,m) => ObjectAssign(m, {
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

  const desc = ObjectGetOwnPropertyDescriptor(target, name);

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
