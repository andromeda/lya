#! /usr/bin/env node

// A front-end for Node.js' vm module where one object holds all
// configuration.


module.exports = {
    analyze,
};


const fs = require('fs');
const vm = require('vm');
const { coerceString } = require('./string.js');
const { assert, test } = require('./test.js');

function analyze({
    entry,
    initialContext,
    conf: {
        context: contextConfig,
        vm: vmConfig
    } = {}
} = {}) {
    const code = coerceString(entry, { allowFileRead: true });
    const context = vm.createContext(initialContext, contextConfig);
    const value = vm.runInContext(code, context, vmConfig);

    return {
        context,
        value,
    };
}

// Simple use
test(module, () => {
    const options = {
        entry: 'x = process.exit(x)',
        conf: {
            context: undefined,
            vm: undefined,
        },
        initialContext: {
            x: 0,
            process: {
                exit: (v) => v + 10,
            },
        },
    };

    const { context, value } = analyze(options);

    assert(context.x === 10, 'JS affects context object');
    assert(options.initialContext.x === context.x, 'JS affects original context, too');
    assert(value === 10, 'Evaluate to last statement or expression.');

    const { context: context2, value: value2 } = analyze(options);

    assert(context2.x === 20 &&
           options.initialContext.x === context2.x &&
           context2.x === value2,
           'Reuse context to, in effect, merge results');
});


// Recursive eval example
test(module, () => {
    const options = {
        // Expression ultimately means: 2 * 8 + -1 => 14
        entry: 'x = eval("2 * eval(`8 + eval(\'x\')`)")',
        conf: {
            context: undefined,
            vm: undefined,
        },
        initialContext: {
            eval: (entry) => {
                // Base case is to reference only the global variable.
                if (entry === 'x') {
                    return -1;
                } else {
                    return analyze(Object.assign({}, options, { entry })).value;
                }
            },
        },
    };

    const { context, value } = analyze(options);

    assert(context.x === 14 && context.x === value,
           'Recursively analyze via eval()');
});
