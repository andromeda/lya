// Responsible for creating proxy handlers and functions that monitor
// each possible iteration for a JS object.


module.exports = {
  createProxyApplyHandler,
  createProxyConstructHandler,
  createProxyGetHandler,
  createProxyHandlerObject,
  createProxyHasHandler,
  createProxySetHandler,
  maybeAddProxy,
};

const {withCatch} = require('./control.js');
const {assert, assertDeepEqual, test} = require('./test.js');
const {
  createLyaState,
  getDeclaringModule,
  registerReference,
  setCurrentModule,
  getModuleRelativeOPath,
} = require('./state.js');


// Like new Proxy(), except construction is conditional, and any
// created instances are tracked.
function maybeAddProxy(env, obj, handler) {
  let { proxy, name } = env.metadata.get(obj);

  if (!proxy) {
    try {
      proxy = new Proxy(obj, handler);

      const type = typeof obj;
      env.counters[type] = (env.counters[type] || 0) + 1;
      ++env.counters.total;
    } catch (e) {
      // Proxy() already knows what it wants, so we can use an
      // exception to avoid writing a bunch of defensive checks.
      // Since the same TypeError is raised for either argument, we at
      // least need to be sure that the handler wasn't the issue.
      if (e instanceof TypeError && isHandlerObject(handler)) {
        return undefined;
      }

      throw e;
    }

    env.metadata.set(obj, { proxy });

    // Unless we can afford it, do not track the object referenced by
    // the proxy here.  It would prevent the garbage collector from
    // collecting the underlying WeakMap key.
    env.metadata.set(proxy, {
      // Convention: '*' means 'Proxy'
      name: name ? name + '*' : name,
    });
  }

  return proxy;
}

const HANDLER_KEYS = new Set(['get', 'has', 'set', 'apply', 'construct']);

function isHandlerObject(v) {
  try {
    return Object
      .keys(v)
      .every((k) => (
        HANDLER_KEYS.has(k) &&
          typeof v[k] === 'function'))
  } catch (e) {
    return false;
  }
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


function createProxyGetHandler(env, typeClass) {
  return function get(target, name) {
    const {
      currentModule,
      metadata,
      config: {
        hooks: {
          onRead,
        },
      },
      log,
    } = env;

    log.push({ handler: 'get', target, name });

    const currentValue = Reflect.get(...arguments);
    const maybeMetadata = metadata.get(currentValue, () => false);

    // Failure to procure metadata means that the object is not worth
    // tracking (literals, undefined)
    if (!maybeMetadata) return currentValue;

    registerReference(env, currentValue);
    metadata.set(currentValue, {
      parent: (target === env.context || target === global)
        ? currentModule
        : target,
      name,
    });

    const { proxy } = metadata.get(currentValue);

    // Lazily create proxies to extend scope of monitoring.
    if (!proxy) {
      // TODO: Select typeclass dynamically
      maybeAddProxy(env, currentValue, createProxyHandlerObject(env, 'lazy'));
    }

    onRead({
      target,
      name,
      nameToStore: getModuleRelativeOPath(env, currentValue),
      currentModule: metadata.get(currentModule).name,
      typeClass,
    });

    // The proxy still might not have been created.
    // Prefer it only if the environment wants it to exist.
    return metadata.get(currentValue).proxy || currentValue;
  };
}


/* eslint-disable-next-line no-unused-vars */
function createProxySetHandler(env, typeClass) {
  return function set(target, name, value) {
    const {
      metadata,
      currentModule,
      config: {
        hooks: {
          onWrite,
        },
      },
      log,
    } = env;

    // When this flag appears, it means then Lya updated the global
    // object proxy's circular reference.  This happens only once per
    // environment, and is not relevant for an analysis. This is why
    // we noop for this case.
    if ('_noop_set' in env) {
      delete env._noop_set;
      return;
    }

    log.push({ handler: 'set', target, name, value });

    registerReference(env, target);
    const { parent } = metadata.get(target);
    const { name: parentName } = metadata.get(parent);
    const nameToStore = getModuleRelativeOPath(env, parent) + '.' + name;

    if (name) {
      onWrite({
        target,
        name,
        value,
        currentModule,
        parentName,
        nameToStore,
      });
    }

    return Reflect.set(...arguments);
  };
}


/* eslint-disable-next-line no-unused-vars */
function createProxyHasHandler(env, typeClass) {
  return function has(target, prop) {
    const {
      context,
      currentModule,
      metadata,
      config: {
        hooks: {
          onHas,
        },
      },
      log,
    } = env;

    log.push({ handler: 'has', target, prop });

    const { name: currentName, parent } = metadata.get(currentModule);
    const result = Reflect.has(...arguments);
    const nameToStore = getModuleRelativeOPath(metadata, parent) + '.' + prop.toString();

    if (parent === context && !result) {
      onHas({
        target,
        prop,
        currentName,
        nameToStore,
      });
    }

    return result;
  };
}


/* eslint-disable-next-line no-unused-vars */
function createProxyConstructHandler(env, typeClass) {
  return function construct(target, args) {
    const {
      currentModule,
      metadata,
      config: {
        hooks: {
          onConstruct,
        },
      },
      log,
    } = env;

    log.push({ handler: 'construct', target, args });

    if (target !== Proxy) {
      onConstruct({
        target,
        args,
        currentName: metadata.get(currentModule).name,
        nameToStore: target.name,
      });
    }

    // eslint-disable-next-line new-cap
    return new target(...args);
  };
}


function createProxyApplyHandler(env, typeClass) {
  return function apply(target, thisArg, argumentsList) {
    const {
      currentModule,
      metadata,
      config: {
        hooks: {
          onCallPre,
          onCallPost,
        },
      },
      log,
    } = env;

    log.push({ handler: 'apply', target, thisArg, argumentsList });

    registerReference(env, target);

    const nameToStore = getModuleRelativeOPath(env, target);
    const declareModule = getDeclaringModule(env, target);

    const info = {
      target,
      thisArg,
      argumentsList,
      name: target.name,
      nameToStore,
      currentModule: metadata.get(currentModule).name,
      declareModule: metadata.get(declareModule).name,
      typeClass,
    };

    const newTarget = onCallPre(info);

    if (newTarget) {
      info.target = target = newTarget;
    }

    // In case the target is not a pure function Reflect doesnt work
    // for example: in native modules
    info.result = withCatch(() => target(...argumentsList),
        () => Reflect.apply(...arguments));

    onCallPost(info);

    return info.result;
  };
}

test(() => {
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
    assert(currentModule === 'M',
           'Capture the module ID');
    assert(declareModule === 'M',
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

  env.metadata.set(module, {
    name: 'M',
  });

  env.metadata.set(proxyTarget, {
    parent: module,
    name: 'alias',
  });


  const apply = createProxyApplyHandler(env, 'T');
  const proxy = new Proxy(proxyTarget, { apply });
  const returned = proxy.apply(junkThis, [6, 7, 8]);

  assert(preCalled && postCalled,
        'Call onCallPre and onCallPost hooks');

  assert(returned === (6 * 7 * 8),
         'Forward the functions result');
});
