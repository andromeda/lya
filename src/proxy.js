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

// Like new Proxy(), except the instance is tracked.
function maybeAddProxy(env, obj, handler) {
  let { proxy } = env.metadata.get(obj);

  if (!proxy) {
    proxy = new Proxy(obj, handler);
    setMetadata(obj, { proxy });
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
      metadata: {
        get,
      },
      config: {
        hooks: {
          onRead,
        },
      },
    } = env;

    const nameToStore = (
      get(global[name]).name ||
      get(target[name]).name ||
      get(target).name ||
      null
    );

    if (nameToStore && name) {
      onRead({
        target,
        name,
        nameToStore,
        currentModule: getOPath(get, target),
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
        nameToStore: getOPath(parent) + '.' + prop.toString(),
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
      methodNames,
      moduleName,
      objectPath,
      objectName,
      requireLevel,
      config: {
        hooks: {
          onCallPre,
          onCallPost,
        },
      },
    } = env;

    const currentName = objectPath.get(target);
    const birthplace = objectName.has(target) ? objectName.get(target) : null;
    const birthName = birthplace + '.' + target.name;
    const currentModule = moduleName[requireLevel];
    const origReqModuleName = argumentsList[0];

    const nameToStore =
              (target.name === 'require') ? 'require(\'' +
              origReqModuleName + '\')' :
              methodNames.has(target) ? methodNames.get(target) :
              (birthplace && (currentModule === currentName)) ? birthName :
              null;

    const info = {
      target,
      thisArg,
      argumentsList,
      name: target.name,
      nameToStore,
      currentModule,
      declareModule: currentName,
      typeClass,
    };

    if (nameToStore) {
      const newTarget = onCallPre(info);
      if (newTarget) {
        info.target = target = newTarget;
      }
    }

    // In case the target is not a pure function Reflect doesnt work
    // for example: in native modules
    info.result = withCatch(() => target(...argumentsList),
        () => Reflect.apply(...arguments));

    if (nameToStore) {
      onCallPost(info);
    }

    return result;
  };
}
