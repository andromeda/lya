#! /usr/bin/env node

// Lya is a front-end for Node.js' vm module. It runs code under a
// context that monitors module-level interactions.
//
// This module operates on a big, mutable state object. By convention,
// one of these objects is always bound to an `env` identifier.

// Type Classes
// user-globals: e.g., global.x, x,
// node-globals: console, setImmediate,
// module-locals: exports, require, module, __filename, __dirname
// module-returns: exports, module.exports


module.exports = {
    analyze,
};


const fs = require('fs');
const vm = require('vm');
const config = require('./config.js');
const { coerceString } = require('./string.js');
const { assert, test } = require('./test.js');

function analyze(entry, state) {
    const code = coerceString(entry);

    // Create the VM context in terms of the configuration 
    const mock = createMockGlobal(state);
    const context = vm.createContext(eventEmitter, state.conf.context);

    // Run the code. The context and state gain useful data as a side effect.
    const entryResult = vm.runInContext(code, context, state.conf.vm);

    return {
        state,
        context,
        entryResult,
    };
}


function createEnvironment({ hooks, context, vm }) {
    const env = {
        conf: {
            hooks: config.configureHooks(hooks),
            context: config.configureVmContext(context),
            vm: config.configureVm(vm),
        },
        defaultNames: require('./default-names.json'),
        moduleName: [],
        requireLevel: 0,
        results: {},
        objectName: new WeakMap(),
        objectPath: new WeakMap(),
        methodNames: new WeakMap(),
        storePureFunctions: new WeakMap(),
        globalNames: new Map(),
        withProxy: new WeakMap(),
        passedOver: new Map(),
        clonedFunctions: new Map(),
        candidateGlobs: new Set(),
        candidateModule: new Map(),
        getObjectInfo: getObjectInfo.bind(null, env),
        counters: {
            totals: 0,
            objects: 0,
            functions: 0,
        },
    };

    return env;
}

const nativeModules = Object.keys(process.binding('natives'));

function stepOut(requireLevel, name) {
    if (requireLevel !== 0 && nativeModules.indexOf(name) === -1) {
        return requireLevel - 1;
    } else {
        return requireLevel;
    }
}

test(module, () =>
     assert(stepOut(1, 'fs') === 1 && stepOut(1, './fs.js') === 0,
            'stepOut: only decrement when not referencing a native module.'))

function createMockGlobal(state) {
    const {
        onCallPre,
        onCallPost,
        onConstruct,
        onHas,
        onImport,
        onRead,
        onWrite,
        sourceTransform,
    } = state.conf.hooks;
    
    return shallowMerge(global, {
        Module: shallowMerge(Module, {
            _load: function(...args) {
                onImport({
                    caller: state.moduleName[state.requireLevel],
                    callee: Module._resolveFilename(...args),
                    name: args[0],
                });

                return Module._load(...args);
            },
            require: function (moduleId) {                
                return require(moduleId);
            },
        }),
        process: shallowMerge(process, {
            exit: function () {
                onExit();
            },
        }),
    });
}

const getObjectInfo = (env, obj) => ({
    // TODO: Add more info...?
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



const setProxy = (env, blacklist, type, obj, handler) => {
    if (elementOf(blacklist, env.methodNames.get(obj))) {
        return obj;
    }

    ++env.counters.total;
    ++env.counters[type];

    return new Proxy(obj, handler);
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
            context: {
                include,
            },
        },
    } = env;
    
    if (!elementOf(include, 'user-globals')) {
        return global;
    }

    const tempGlobal = setProxy(global, {}, 'object');
    methodNames.set(tempGlobal, 'global');
    objectPath.set(tempGlobal, moduleName[requireLevel]);

    const typeClass = 'user-globals';
    return setProxy(tempGlobal, {
      get: createProxyGetHandler(env, typeClass),
      set: createProxySetHandler(env, typeClass),
      has: createProxyHasHandler(env, typeClass),
    }, 'object');
}


function createGlobalVariable(env, name) {
    const {
        objectPath,
        moduleName,
        requireLevel,
        conf: {
            context: {
                include,
                depth,
            },
        },
    } = env;

    if (global[name] !== undefined) {
        if (!elementOf(include, 'node-globals')) {
            return global[name];
        }

        env.stopLoops = new WeakMap();
        const proxyObj = proxyWrap(global[name], createHandler('node-globals'), name, depth);

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
                clonedFunctions.set(e, getClone(global[e], e));
            });
        }
    }

    return clonedFunctions;
}

function passJSONFile(func, json) {
    const returnValue = {};

    for (const funcClass in json) {
        if (Object.prototype.hasOwnProperty.call(json, funcClass)) {
            for (const name of json[funcClass]) {
                returnValue[name] = func(name);
            }
        }
    }

    return returnValue;
}


function setLocalGlobal(env) {
    const localGlobal = passJSONFile(createGlobalVariable, defaultNames.globals);
    localGlobal['proxyGlobal'] = createGlobalProxy(env);
    return localGlobal;
}


const computePrologue = (function () {
    const cache = {};

    return (env) => {
        if (!cache[env]) {
            const {
                conf: {
                    enableWith,
                },
                defaultNames,
            } = env;

            const declaration = enableWith ? 'let' : 'var';            

            let prologue = '';

            const setDeclaration = (name) => {
                prologue += `${declaration} ${name} = localGlobal["${name}"];\n`;
            };

            generateGlobals();
            cloneFunctions();
            passJSONFile(setDeclaration, defaultNames);
            prologue = declaration + ' global = localGlobal["proxyGlobal"]\n' + prologue;
            prologue = enableWith ? 'with (withGlobal) {\n' + prologue : prologue;

            cache[env] = prologue;
        }

        return cache[env];
    };
})();


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

    return setProxy(
        localCopy,
        filterObject(createHandler('module-locals'), ['apply', 'get', 'set']),
        'object');
};



function createSafetyValve(env) {
    return coerceMap(['toString', 'valueOf', 'prototype', 'name', 'children'], () => true);
}

function createProxyHandlerObject(env, typeClass) {
    return {
        get: createProxyGetHandler(env, typeClass),
        has: createProxyHasHandler(env, typeClass),
        set: createProxySetHandler(env, typeClass),
        apply: createProxyApplyHandler(env, typeClass),
        construct: createProxyConstructHandler(env, typeClass),
    };
};


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
            moduleName,
            methodNames,
            conf: {
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
        const birthplace = objectName.has(target) ?
              objectName.get(target) : null;
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
        try {
            info.result = Reflect.apply(...arguments);
        } catch (e) {
            info.result = target(...argumentsList);
        }

        if (nameToStore) {
            onCallPost(info);
        }

        return result;
    };
}
