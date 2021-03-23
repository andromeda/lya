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

// Like new Proxy(), except the instance is tracked in Lya state.
function maybeAddProxy(env, obj, handler) {
  let proxy = env.proxies.get(obj);

  if (!proxy && !elementOf(env.safetyValve, env.methodNames.get(obj))) {
    proxy = new Proxy(obj, handler);

    env.proxies.set(obj, {
      proxy,
      type: typeof obj,
    });
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
    const nameToStore = (
            env.globalNames.has(name) ?
                env.globalNames.get(name) :
                (env.globalNames.has(target[name]) ?
                   env.globalNames.get(target[name]) :
                   (env.methodNames.has(target[name]) ?
                      env.methodNames.get(target[name]) :
                      (env.methodNames.has(target) ?
                         env.methodNames.get(target) :
                         null))));

    if (nameToStore && name) {
      env.onRead({
        target,
        name,
        nameToStore,
        currentModule: env.objectPath.get(target),
        typeClass,
      });
    }

    return Reflect.get(...arguments);
  };
}


function createProxySetHandler(env, typeClass) {
  return function(target, name, value) {
    const {
      globalNames,
      objectPath,
      methodNames,
      config: {
        hooks: {
          onWrite,
        },
      },
    } = env;

    const currentModule = objectPath.get(target);

    if (methodNames.has(target)) {
      const parentName = methodNames.get(target);
      const nameToStore = globalNames.has(name) ?
                  globalNames.get(name) :
                  parentName + '.' + name;

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
    const parentObject = methodNames.get(target);
    const result = Reflect.has(...arguments);
    const nameToStore = parentObject + '.' + prop.toString();

    if (parentObject === 'global' && !result && prop !== 'localGlobal') {
      candidateGlobs.add(prop);

      if (!candidateModule.has(prop)) {
        candidateModule.set(prop, currentName);
        globalNames.set(prop, prop);
      }

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
