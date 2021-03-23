// Responsible for overriding the behavior of require('module') while
// control remains in a callback.
//
// Motivation: We need to extend CommonJS with two module-level bindings:
//
// localGlobal - A source of global [1] variables from outside the VM.
// withGlobal  - An object suitable for use in an injected `with () {}`.
//
// Whether the module code is injected into `with` affects how mocked global
// bindings appear to the module. Without `with`, all declarations are hoisted
// using `var`.
//
// [1]: https://i.imgflip.com/52qtcn.jpg

module.exports = {
    callWithModuleOverride,
};


function callWithModuleOverride(env, f) {
    return callWithOwnValues(Module, {
        wrap: overrideModuleWrap(env),
        prototype: Object.assign({}, Module.prototype, {
            require: overrideModuleRequirePrototype(env),
        }),
        _load: overrideModuleLoad(env),
    }, f);
}



const Module = require('module');

const { elementOf } = require('./container-type.js');
const { identity } = require('./functions.js');
const { assert, assertDeepEqual, test } = require('./test.js');

const {
    COMMONJS_MODULE_IDENTIFIERS,
    EXTENDED_COMMONJS_MODULE_IDENTIFIERS,
    IDENTIFIER_CLASSIFICATIONS,
    INJECTED_GLOBAL_IDENTIFIER,
    INJECTED_WITH_GLOBAL_IDENTIFIER,
    NATIVE_MODULES,
    NEGLIGIBLE_EXPORT_TYPES,
} = require('./constants.js')



// The strings used to wrap modules are cached using a closure.
// If you want to use a different `enableWith` configuration, then
// call overrideModuleWrap() with different property values.
//
// Limitation: User code cannot shadow injected identifiers using `let`.
// https://github.com/andromeda/lya/issues/4
//
const originalWrap = Module.wrap;

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


//
// TODO: Clarify why we hook into _load(). Because require() might
// have a cache hit?
//
const originalLoad = Module._load;

function overrideModuleLoad(env) {
    return function _load(...args) {
        env.onImport({
            caller: env.moduleName[env.requireLevel],
            callee: Module._resolveFilename.call(this, ...args),
            name: args[0],
        });

        return originalLoad(...args);
    };
}


test(() => {
    const path = require('path');

    overrideModuleLoad({
        requireLevel: 2,
        moduleName: [
            'foo.js',
            'bar.js',
            'baz.js',
        ],
        onImport: ({ caller, callee, name }) => {
            assert(name === './analyze-module.js' &&
                   caller == 'baz.js' &&
                   path.isAbsolute(callee),
                   'onImport hook monitors Module._load')
        }
    })('./analyze-module.js');
});


const originalProtoRequire = Module.prototype.require;

function overrideModuleRequirePrototype(env) {
    return function require(...args) {
        const {
            results,
            moduleName,
            objectName,
        } = env;
        
        if (moduleName[0] === undefined) {
            moduleName[0] = this.filename;
            results[moduleName[0]] = {};
        }

        const importName = env.currentModuleRequest = args[0];

        // We might not return exactly this. Since Lya
        // monitors inter-module activity, we may return
        // the proxy instead.
        const actualModuleExports = originalProtoRequire.apply(this, args);
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

        if ((!moduleIncluded || moduleExcluded) ||
            (!exportsNegligible && !exportsKnown)) {
            reduceLevel(env, importName);
        }

        if (shouldUseProxy) {
            maybeAddProxy(env, actualModuleExports, exportHandler)
            return env.proxies.get(actualModuleExports).proxy;
        } else { 
            return actualModuleExports;
        }
    };
}


function reduceLevel(env, name) {
    if (env.requireLevel > 0 && !elementOf(NATIVE_MODULES, name)) {
        --env.requireLevel;
    }
}

test(() => {
    const env = { requireLevel: 1 };
    reduceLevel(env, 'fs');
    assert(env.requireLevel === 1,
           'stepOut: only decrement when not referencing a native module.')

})



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
