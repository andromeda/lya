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
  registerReference,
  setCurrentModule,
  getReferenceDepth,
  getDotPath,
  inScopeOfAnalysis,
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
      name: name ? name.toString() + '*' : (name || '').toString(),
    });


    env.config.hooks.onActivity({
      topic: 'proxy',
      name: name || '?',
      proxy,
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
          onActivity,
          onRead,
        },
      },
    } = env;

    onActivity({
      topic: 'get',
      target,
      name,
    });

    const currentValue = Reflect.get(...arguments);
    const maybeMetadata = metadata.get(currentValue, () => false);

    // Failure to procure metadata means that the object is not worth
    // tracking (literals, undefined)
    if (!maybeMetadata) return currentValue;

    registerReference(env, target);
    registerReference(env, currentValue);
    metadata.set(currentValue, {
      parent: target,
      name,
    });

    const { proxy } = metadata.get(currentValue);
    const shouldCreateProxy = shouldProxyTarget(
      env, typeClass, getReferenceDepth(env, currentValue), target, name);

    // Lazily create proxies to extend scope of monitoring.
    if (!proxy && shouldCreateProxy) {
      // TODO: Select typeclass dynamically
      maybeAddProxy(env, currentValue, createProxyHandlerObject(env, 'lazy'));
    }

    onRead({
      target,
      name,
      nameToStore: getDotPath(env, currentValue),
      currentModule: metadata.get(currentModule).name,
      typeClass,
    });

    // A proxy might not have been created due to above reasoning, but
    // prefer it if it's available.
    return metadata.get(currentValue, () => ({proxy: false})).proxy || currentValue;
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
          onActivity,
          onWrite,
        },
      },
    } = env;

    onActivity({
      topic: 'set',
      target,
      name,
      value,
    });

    if (target !== env.context) {
      registerReference(env, target);

      const { parent } = metadata.get(target);
      const nameToStore = getDotPath(env, target) + '.' + name.toString();

      if (name) {
        onWrite({
          target,
          name,
          value,
          currentModule: metadata.get(currentModule).name,
          parentName: parent && metadata.get(parent).name,
          nameToStore,
        });
      }
    }

    return Reflect.set(...arguments);
  };
}


/* eslint-disable-next-line no-unused-vars */
function createProxyHasHandler(env, typeClass) {
  return function has(target, prop) {
    const {
      currentModule,
      metadata,
      config: {
        hooks: {
          onActivity,
          onHas,
        },
      },
    } = env;

    onActivity({
      topic: 'has',
      target,
      prop,
    });

    const { name: currentName } = metadata.get(currentModule);
    const result = Reflect.has(...arguments);
    const nameToStore = getDotPath(env, target) + '.' + prop.toString();

    onHas({
      target,
      prop,
      currentName,
      nameToStore,
    });

    return result;
  };
}


/* eslint-disable-next-line no-unused-vars */
function createProxyConstructHandler(env, typeClass) {
  return function construct(target, args, newTarget) {
    const {
      currentModule,
      metadata,
      config: {
        hooks: {
          onConstruct,
          onActivity,
        },
      },
    } = env;

    onActivity({
      topic: 'construct',
      target,
      args,
      newTarget,
    });

    if (target !== Proxy) {
      onConstruct({
        target,
        args,
        currentName: metadata.get(currentModule).name,
        nameToStore: target.name,
      });
    }

    return Reflect.construct(target, args, newTarget);
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
          onActivity,
        },
      },
    } = env;

    onActivity({
      topic: 'apply',
      target,
      thisArg,
      argumentsList,
    });

    registerReference(env, target);

    const nameToStore = getDotPath(env, target);
    const { initialOccurringModule } = metadata.get(target);

    const info = {
      target,
      thisArg,
      argumentsList,
      name: target.name,
      nameToStore,
      currentModule: metadata.get(currentModule).name,
      declareModule: initialOccurringModule && metadata.get(initialOccurringModule).name,
      typeClass,
    };

    const newTarget = onCallPre(info);

    if (newTarget) {
      info.target = target = arguments[0] = newTarget;
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



const PROXY_PROPERTY_NAME_BLACKLIST = new Set([
  'children',
  'name',
  'prototype',
  'valueOf',
  'toString',
]);

function shouldProxyTarget(env, typeClass, referenceDepth, target, name) {
  const {
    config: {
      depth,
      context,
      fields,
    },
  } = env;

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
  const breaksWhenProxied = (
      PROXY_PROPERTY_NAME_BLACKLIST.has(name)
  );

  return (
    userWantsAProxy &&
    !nodeExpectsActualValue &&
    !breaksWhenProxied
  );
}
