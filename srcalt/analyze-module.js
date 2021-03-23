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

const Module = require('module');
const vm = require('vm');

const { analyze } = require('./analyze.js');
const { assert, assertDeepEqual, test } = require('./test.js');
const { identity } = require('./functions.js');
const { coerceMap, elementOf } = require('./container-type.js');
const config = require('./config.js');


// Constants

const IDENTIFIER_CLASSIFICATIONS = {
    // e.g. global.x, x
    USER_GLOBALS: 'user-globals',

    // e.g. console, setImmediate
    // TODO: Rename to builtin-globals?
    NODE_GLOBALS: 'node-globals',

    // e.g. exports, require, module, __filename, __dirname
    MODULE_LOCALS: 'module-locals',

    // e.g. exports, module.exports
    MODULE_RETURNS: 'module-returns',
};

const NATIVE_MODULES = Object.keys(process.binding('natives'));

const NEGLIGIBLE_EXPORT_TYPES = [
    'boolean',
    'symbol',
    'number',
    'string',
];

const COMMONJS_MODULE_IDENTIFIERS = [
    'exports',
    'require',
    'module',
    '__filename',
    '__dirname',
];


const INJECTED_GLOBAL_IDENTIFIER = 'localGlobal';
const INJECTED_WITH_GLOBAL_IDENTIFIER = 'withGlobal';

// We need a CommonJS superset
const EXTENDED_COMMONJS_MODULE_IDENTIFIERS =
      COMMONJS_MODULE_IDENTIFIERS.concat([
          INJECTED_GLOBAL_IDENTIFIER,
          INJECTED_WITH_GLOBAL_IDENTIFIER,
      ]);




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


// Creates an object suitable for use in createLyaRequireProxy().
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


///////////////////////////////////////////////////////////////////////////////
// Module level API adjustments

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
            'BigInt'
        ],
        node: [
            'console',
            'process'
        ],
    })
    
    assertDeepEqual(names, ['Array', 'BigInt', 'console', 'process'],
                   'Extract global identifiers from dataset');
});


///////////////////////////////////////////////////////////////////////////////
// Module level API adjustments
//
// We need to replace CommonJS with a superset including two extra
// module bindings.
//
// localGlobal - A source of global [1] variables that are injected into module context.
// withGlobal  - An object suitable for use in an injected `with () {}`.
//
// Whether the module code is injected into `with` affects how mocked global
// bindings appear to the module. Without `with`, all declarations are hoisted
// using `var`.
//
// [1]: https://i.imgflip.com/52qtcn.jpg


const originalWrap = Module.wrap;
const originalRequire = Module.prototype.require;
const originalFilename = Module._resolveFilename;
const originalLoad = Module._load;


// Functions returned by this module use a cached wrapper.
// If you want to use a different `enableWith` configuration, then
// call overrideModuleWrap() with different property values.
//
// Limitation: User code cannot shadow injected identifiers using `let`.
// This is a problem because users are normally able to shadow global
// variables.
//
function overrideModuleWrap(env) {
    const { modules, sourceTransform, defaultNames } = env;
    const { enableWith = false } = modules || {};
    const { globals = [] } = defaultNames || {};
    
    const declarator = enableWith ? 'let' : 'var';
    const transform = sourceTransform || identity;

    const declarations = (
        getGlobalNames(globals)
            .reduce((reduction, name) =>
                    `${declarator} ${name} = ${INJECTED_GLOBAL_IDENTIFIER}["${name}"];\n${reduction}`,
                    ''));

    const parameterList = EXTENDED_COMMONJS_MODULE_IDENTIFIERS.join(',');

    // The `null` acts like a "blank" to fill in.
    const lines = (enableWith)
          ? [
              `(function (${parameterList}) {`,
              `  with (${INJECTED_WITH_GLOBAL_IDENTIFIER}) {`,
              null,
              '  }',
              '})',
          ]
          : [
              `(function (${parameterList}) {`,
              null,
              '})',
          ];


    return (script) => {
        env.originalScript = originalWrap(script);
        const transformed = transform(script, env.currentModuleRequest);

        // || fills in the blank.
        return lines.map((l) => l || (declarations + transformed)).join('\n');
    };
};

test(() => {    
    const check = (scenario, { env, script, expected }) => {
        const wrapped = overrideModuleWrap(env)(script);
        const lines = wrapped.split('\n');
        let moduleBodyLines;

        if (env.modules.enableWith) {
            const pattern = `with \\(${INJECTED_WITH_GLOBAL_IDENTIFIER}\\)`;
            const re = new RegExp(pattern);
            
            assert(re.test(lines[1]),
                   `${scenario}: Wrap module with 'with {}'`);

            moduleBodyLines = lines.slice(2, -2);
        } else {
            moduleBodyLines = lines.slice(1, -1);
        }

        const actual = moduleBodyLines.join('\n');

        assert(actual === expected, scenario);
    }

    check('Apply sourceTransform hook', {
        env: {
            currentModuleRequest: 'foo',
            modules: {
                enableWith: false,
            },
            sourceTransform: (src, moduleId) => {
                assert('foo' === moduleId,
                       `Pass env.currentModuleRequest to sourceTransform()`);
                return src.replace('1', '2');
            },
        },
        script: 'console.log(1 + 2)',
        expected: 'console.log(2 + 2)',
    });


    check('Inject mock globals', {
        env: {
            defaultNames: {
                globals: {
                    es: [
                        "Array",
                    ],
                },
            },
            modules: {
                enableWith: true,
            },
        },
        script: 'void 0',
        expected: `let Array = ${INJECTED_GLOBAL_IDENTIFIER}["Array"];\nvoid 0`,
    });
});


function callWithModuleOverride(env, f) {
    const {
        modules: {
            include,
            exclude,
            enableWith,
        },
        moduleName,
        sourceTransform,
        objectName,
        onImport,
        requireLevel,
        results,
    } = env;

    
    const _load = function(...args) {
        const name = args[0];
        const path = Module._resolveFilename.call(this, ...args);

        onImport({
            caller: moduleName[requireLevel],
            callee: path,
            name: name,
        });

        return Module._load(...args);
    };    

    const _require = function (...args) {
        if (moduleName[0] === undefined) {
            moduleName[0] = this.filename;
            results[moduleName[0]] = {};
        }

        const importName = env.currentModuleRequest = args[0];

        // We might not return exactly this. Since Lya
        // monitors inter-module activity, we may return
        // the proxy instead.
        const actualModuleExports = require(...args);
        const moduleExportType = typeof moduleExports;

        const moduleIncluded = elementOf(include, moduleName[requireLevel]);
        const moduleExcluded = elementOf(exclude, moduleName[requireLevel]);
        const exportsKnown = objectName.has(actualModuleExports);
        const exportsNegligible = elementOf(NEGLIGIBLE_EXPORT_TYPES, moduleExportType);
        const shouldUseProxy = (
            exportsKnown || elementOf(include, 'module-returns')
        );

        objectName.set(
            actualModuleExports,
            (type === 'function' && actualModuleExports.name !== '')
                ? 'require(\'' + importName + '\').' + actualModuleExports.name
                : 'require(\'' + importName + '\')');

        if ((!moduleIncluded || moduleExcluded) || (!exportsNegligible && !exportsKnown)) {
            env.requireLevel = reduceLevel(importName);
        }

        return shouldUseProxy
            ? maybeAddProxy(actualModuleExports, exportHandler)
            : actualModuleExports;
    };

    return callWithOwnValues(Module, {
        wrap: overrideModuleWrap(env),
        prototype: Object.assign({}, Module.prototype, {
            require: _require,
        }),
        _resolveFilename,
        _load,
    }, f);
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



function stepOut(env, name) {
    if (env.requireLevel > 0 && !elementOf(NATIVE_MODULES, name)) {
        --env.requireLevel;
    }
}

test(() => {
    const env = { requireLevel: 1 };

    stepOut(env, 'fs');

    assert(env.requireLevel === 1,
           'stepOut: only decrement when not referencing a native module.')

})


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
