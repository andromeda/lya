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

const {elementOf} = require('./container-type.js');
const {withCatch} = require('./control.js');
const {assert, assertDeepEqual, test} = require('./test.js');
const {
  createReferenceMetadataStore,
  getDeclaringModule,
  getOPath,
} = require('./metadata.js');


// Like new Proxy(), except the instance is tracked.
function maybeAddProxy(env, obj, handler) {
  let { proxy } = env.metadata.get(obj);

  if (!proxy) {
    proxy = new Proxy(obj, handler);
    env.metadata.set(obj, { proxy });
  }

  return proxy;
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
  return function(target, name) {
    const {
      metadata,
      config: {
        hooks: {
          onRead,
        },
      },
    } = env;

    const nameToStore = (
      metadata.get(global[name]).name ||
      metadata.get(target[name]).name ||
      metadata.get(target).name ||
      null
    );

    if (nameToStore && name) {
      onRead({
        target,
        name,
        nameToStore,
        currentModule: getOPath(metadata, target),
        typeClass,
      });
    }

    const currentValue = Reflect.get(...arguments);

    return currentValue;
  };
}


function createProxySetHandler(env, typeClass) {
  return function(target, name, value) {
    const {
      metadata,
      config: {
        hooks: {
          onWrite,
        },
      },
    } = env;

    const { parent, module } = metadata.get(target);
    const { name } = metadata.get(parent);

    if (name) {
      hookCheck(onWrite, {
        target,
        name,
        value,
        currentModule,
        parentName,
        nameToStore,
      });

      if (parentName === 'global' || typeof value === 'number') {
        globalNames.set(name, nameToStore);
      }
    }

    return Reflect.set(...arguments);
  };
}


function createProxyHasHandler(env, typeClass) {
  return function(target, prop) {
    const {
      candidateGlobs,
      globalNames,
      moduleName,
      methodNames,
      metadata,
      config: {
        hooks: {
          onHas,
        },
      },
    } = env;

    const currentName = moduleName[env.requireLevel];
    const { parent } = metadata.get(target);
    const result = Reflect.has(...arguments);
    const nameToStore = parent + '.' + prop.toString();

    if (parentObject === global && !result) {
      onHas({
        target,
        prop,
        currentName,
        nameToStore: getOPath(metadata, parent) + '.' + prop.toString(),
      });
    }

    return result;
  };
}


function createProxyConstructHandler(env, typeClass) {
  return function(target, args) {
    if (target.name !== 'Proxy') {
      onConstruct({
        target,
        args,
        currentName: env.moduleName[env.requireLevel],
        nameToStore: target.name,
      });
    }

    // eslint-disable-next-line new-cap
    return new target(...args);
  };
}


function createProxyApplyHandler(env, typeClass) {
  return function(target, thisArg, argumentsList) {
    let result;

    const {
      requireLevel,
      moduleName,
      metadata,
      config: {
        hooks: {
          onCallPre,
          onCallPost,
        },
      },
    } = env;

    const nameToStore = getOPath(metadata, target);
    const currentModule = moduleName[requireLevel];

    const info = {
      target,
      thisArg,
      argumentsList,
      name: target.name,
      nameToStore,
      currentModule,
      declareModule: getOPath(metadata, getDeclaringModule(metadata, target)),
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
    assert(nameToStore === 'M.alias',
           'Capture the analysis-specific alias of the function');
    assert(currentModule === 'bar',
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

  const metadata = createReferenceMetadataStore();

  metadata.set(module, {
    name: 'M',
  });

  metadata.set(proxyTarget, {
    parent: module,
    name: 'alias',
  });

  const env = {
    requireLevel: 1,
    moduleName: ['foo', 'bar'],
    metadata,
    config: {
      hooks: {
        onCallPre,
        onCallPost,
      },
    },
  };

  const apply = createProxyApplyHandler(env, 'T');
  const proxy = new Proxy(proxyTarget, { apply });
  const returned = proxy.apply(junkThis, [6, 7, 8]);

  assert(preCalled && postCalled,
        'Call onCallPre and onCallPost hooks');

  assert(returned === (6 * 7 * 8),
         'Forward the functions result');
});
