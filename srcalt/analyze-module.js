/*
Uses analyze.js to monitor module-level interactions.

  const env = createLyaState(...);
  const req = createLyaRequireProxy(env, require);

Maintainers:

  - Code is imperative for performance reasons. You can understand and
    protect invariants using callWith* functions and unit tests.

  - Try to remember to make every function do one thing. If a function
    returns a value AND has a side-effect... that's two things.
*/


module.exports = {
    createLyaState,
    createLyaRequireProxy,
};


///////////////////////////////////////////////////////////////////////////////
// Implementation

const vm = require('vm');

const { analyze } = require('./analyze.js');
const { assert, assertDeepEqual, test } = require('./test.js');
const { identity } = require('./functions.js');
const { coerceMap, elementOf } = require('./container-type.js');
const { callWithModuleOverride } = require('./module-override.js');
const config = require('./config.js');



///////////////////////////////////////////////////////////////////////////////
// High-level API


// We start an analysis using the module resolver. This means that
// when a require() function is used, it will override shared APIs
// and change how required code behaves.
function createLyaRequireProxy(env, requireFunction) {
    // Monitor applications.
    const baseApply = createProxyApplyHandler(
        env, IDENTIFIER_CLASSIFICATIONS.MODULE_LOCALS);

    // Make it so that calls evaluate under an adjusted global API.
    // Adds invariant: The user cannot concurrently execute code that
    // assumes these overrides have not been applied.
    const apply = function (...args) {
        return callWithAllOverrides(env, () => baseApply(...args));
    };
    
    maybeAddProxy(env, requireFunction, { apply });

    return env.proxies.get(requireFunction).proxy;
}


// Creates an object suitable for use in createLyaRequireProxy().  The
// user is responsible for passing the state object because that
// simplifies recursive use of Lya. Meaning that if a hook calls Lya,
// it can reuse the state object.
function createLyaState({
    analysis: entry,
    context: contextConfig,
    vm: vmConfig,
    lya: lyaConfig,
}) {
    return Object.assign(
        config.configureVmContext(contextConfig),
        config.configureVm(vmConfig),
        config.configureLya(lyaConfig),
        {
            candidateGlobs: new Set(),
            candidateModule: new Map(),
            clonedFunctions: new Map(),
            defaultNames: require('./default-names.json'),
            entry,
            globalNames: new Map(),

            // The last unresolved module name used as an argument to require()
            // in the analyzed program. Used to trace dependency relationships.
            currentModuleRequest: null,

            methodNames: new WeakMap(),
            moduleName: [],
            objectName: new WeakMap(),
            objectPath: new WeakMap(),
            passedOver: new Map(),
            proxies: new Map(),
            objectPath: new WeakMap(),
            requireLevel: 0,
            results: {},
            safetyValve: createSafetyValve(),
            storePureFunctions: new WeakMap(),
            withProxy: new WeakMap(),
        });
}



function callWithVmOverride(env, f) {
    const originalRun = vm.runInThisContext;

    const runInThisContext = function (code, options) {
        const {
            conf: {
                lya: {
                    printCode,
                    modules: {
                        include,
                        exclude,
                    },
                },
            },
        } = env;

        const {
            filename,
        } = options;
        
        if (printCode) {
            console.log('Module: %s\n%s\n', filename, code);
        }

        if (!elementOf(include, filename) || elementOf(exclude, filename)) {
            if (env.requireLevel !== 0) {
                env.requireLevel++;
                moduleName[env.requireLevel] = filename;
            }

            return originalRun(originalScript, options);
        }

        env.requireLevel++;
        moduleName[env.requireLevel] = filename;

        const codeToRun = originalRun(code, options);

        if (!Object.prototype.hasOwnProperty.
            call(analysisResult, moduleName[env.requireLevel])) {
            analysisResult[moduleName[env.requireLevel]] = {};
        }

        return maybeAddProxy(codeToRun, handlerAddArg);
    };

    
    return callWithOwnValues(vm, { runInThisContext }, f);
}

function callWithAllOverrides(env, f) {
    const add = (k) => (v) => ({ [k]: v });
    const withVm = (vm) => f({ Module, vm });
    const withModule = (vm) => callWithVmOverride(env, withVm);

    const overridesToKeys = [
        [callWithModuleOverride, 'Module']
        [callWithVmOverride, 'vm']
    ];

    return overridesToKeys.reduce((reduction, [override, key]) => {        
        return (api) => {
            return override(env, (v) => Object.assign({ [key]: v }, api))
        };
    }, f)({});    
}



const getObjectInfo = (env, obj) => ({
    // TODO: Simplify
    name: (env.objectName.has(obj)
           ? env.objectName.get(obj)
           : (env.methodNames.has(obj)
              ? env.methodNames.get(obj)
              : (env.globalNames.has(obj.name)
                 ? env.globalNames.get(obj.name)
                 : (obj.name
                    ? obj.name
                    : null)))),
    path: env.objectPath.has(obj)
        ? env.objectPath.get(obj)
        : null,
});



const maybeAddProxy = (env, obj, handler) => {
    if (!elementOf(env.safetyValve, env.methodNames.get(obj))) {
        env.proxies.set(obj, {
            proxy: new Proxy(obj, handler),
            type: typeof obj,
        });
    }
};

const exportProxyHandler = (env) => ({
    apply: (target, thisArg, argumentsList) => {
        env.conf.hooks.onCallPre(info);

        info.result = Reflect.apply(...arguments);

        env.conf.hooks.onCallPost(info);

        return info.result;
    },
    get: (target, name, receiver) => {
    },
});


// We wrap the global variable in a proxy
function createGlobalProxy(env) {
    const {
        methodNames,
        objectPath,
        requireLevel,
        conf: {
            lya: {
                include,
            },
        },
    } = env;

    const typeClass = 'user-globals';
    
    if (elementOf(include, typeClass)) {
        const tempGlobal = maybeAddProxy(global, {});
        methodNames.set(tempGlobal, 'global');
        objectPath.set(tempGlobal, moduleName[requireLevel]);

        maybeAddProxy(tempGlobal, 'user-globals');
    }
}


function createGlobalVariable(env, name) {
    const {
        objectPath,
        moduleName,
        requireLevel,
        context,
        conf: {
            lya: {
                include,
                depth,
            },
        },
    } = env;

    if (context[name] !== undefined) {
        if (!elementOf(include, 'node-globals')) {
            return context[name];
        }

        env.stopLoops = new WeakMap();
        const proxyObj = proxyWrap(context[name], createHandler('node-globals'), name, depth);

        if (name !== 'Infinity' && name !== 'NaN') {
            objectPath.set(proxyObj, moduleName[requireLevel]);
        }

        return proxyObj;
    }

    return 0;
}


function cloneFunctions(globalDefaultNames) {
    const clonedFunctions = new Map();

    for (const topClass in globalDefaultNames) {
        if (Object.prototype.hasOwnProperty.call(globals, topClass)) {
            globals[topClass].filter((e) => {
                if (typeof global[e] === 'function' && e !== 'Promise') {
                    return e;
                }
            }).forEach((e) => {
                clonedFunctions.set(e, cloneFunction(global[e], e));
            });
        }
    }

    return clonedFunctions;
}



// User can remove things from json file that create conf
function generateGlobals() {
    // flatten globals under defaultNames.globals.*
    flattenAndSkip(['es', 'node', 'other'], 'globals');
    defaultNames.globals = skipMe(defaultNames.globals);
    // flatten locals under defaultNames.locals.*
    flattenAndSkip(['node'], 'locals');
};



// require, __dirname, __filename
function wrapModuleInputs(env, obj, count)  {
    const {
        conf: {
            inputString,
            context: {
                include,
            },
        },
        methodNames,
        objectPath,
        moduleInputNames,
        moduleName,
        requireLevel,
    } = env;

    const type = typeof obj[count];
    let localCopy;

    if (type === 'string') {
        if (inputString) {
            // eslint-disable-next-line no-new-wrappers
            localCopy = new String(obj[count]);
        } else {
            return obj[count];
        }
    } else {
        localCopy = obj[count];
    }

    methodNames.set(localCopy, moduleInputNames[count]);
    objectPath.set(localCopy, moduleName[requireLevel]);

    if (!elementOf(include, 'module-locals')) {
        return localCopy;
    }

    return maybeAddProxy(
        localCopy,
        filterObject(createHandler('module-locals'), ['apply', 'get', 'set']));
}


function createSafetyValve() {
    return coerceMap(['toString', 'valueOf', 'prototype', 'name', 'children'], {
        weak: false,
        makeValue: () => true,
    });
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


// Create a function suitable for use as a value for 'get'
// in `new Proxy(..., { get })`.
function createProxyGetHandler(env, typeClass) {
    return function (target, name) {
        const currentModule = env.objectPath.get(target);
        const nameToStore = (
            env.globalNames.has(name)
                ? env.globalNames.get(name)
                : (env.globalNames.has(target[name])
                   ? env.globalNames.get(target[name])
                   : (env.methodNames.has(target[name])
                      ? env.methodNames.get(target[name])
                      : (env.methodNames.has(target)
                         ? env.methodNames.get(target)
                         : null))));

        if (nameToStore && name) {
            env.conf.hooks.onRead({
                target,
                name,
                nameToStore,
                currentModule,
                typeClass,
            });
        }

        return Reflect.get(...arguments);
    };
}

// Create a function suitable for use as a value for 'set'
// in `new Proxy(..., { set })`.
function createProxySetHandler(env, typeClass) {
    return function (target, name, value) {
        const {
            globalNames,
            objectPath,
            methodNames,
            conf: {
                hooks: {
                    onWrite,
                },
            },
        } = env;

        const currentModule = objectPath.get(target);

        if (methodNames.has(target)) {
            const parentName = methodNames.get(target);
            const nameToStore = globalNames.has(name)
                  ? globalNames.get(name)
                  : parentName + '.' + name;

            hookCheck(onWrite, {
                target,
                name,
                value,
                currentModule,
                parentName,
                nameToStore
            });

            if (parentName === 'global' || typeof value === 'number') {
                globalNames.set(name, nameToStore);
            }
        }

        return Reflect.set(...arguments);
    };
};

// Create a function suitable for use as a value for 'has'
// in `new Proxy(..., { has })`.
function createProxyHasHandler(env, typeClass) {
    return function(target, prop) {
        const {
            candidateGlobs,
            globalNames,
            moduleName,
            methodNames,
            onHas,
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
};

// Create a function suitable for use as a value for 'construct'
// in `new Proxy(..., { construct })`.
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

// Create a function suitable for use as a value for 'construct'
// in `new Proxy(..., { apply })`.
function createProxyApplyHandler(env, typeClass) {
    return function(target, thisArg, argumentsList) {
        let result;
        const currentName = objectPath.get(target);
        const birthplace = objectName.has(target) ? objectName.get(target) : null;
        const birthName = birthplace + '.' + target.name;
        const currentModule = moduleName[env.requireLevel];
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
