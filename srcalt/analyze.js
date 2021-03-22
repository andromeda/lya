#! /usr/bin/env node

// A front-end for Node.js' vm module such that one object acts as a
// JS virtual machine state.

module.exports = {
    analyze,
};


const fs = require('fs');
const vm = require('vm');
const { coerceString } = require('./string.js');
const { assert, test } = require('./test.js');
const { noop } = require('./functions.js');
const { callWithOwnValues } = require('./container-type.js');


// A pattern for obtaining the global object regardless of the JS
// runtime used.
const universalGlobal = new Function('return this')();

// Called for its effect
function analyze(env) {
    const { entry, conf } = env || {};
    const { vm: vmConfig } = conf || {};
    const code = coerceString(entry, { allowFileRead: true });

    try {
        // runInThisContext would not introduce behavioral difference
        // from runInContext, but paper theses prefer to reason about
        // a context that already exists for built-in references on
        // the C++ side of things.
        env.value = vm.runInThisContext(code, vmConfig);
    } catch (e) {
        env.value = e;
    }

    return env;
}

// Simple use
test(() => {
    const g = universalGlobal;
    const exit = v => v + 10;

    callWithOwnValues(g, { x: 8, process: Object.assign({}, process, { exit }) }, () => {
        const options = {
            entry: 'x = process.exit(x)',
        };

        const ref = analyze(options);

        assert(typeof g === 'object', 'Capture global');
        assert(ref === options, 'Operate on the input argument');
        assert(g.x === 18, 'JS affects context object');
        assert(ref.value === 18, 'Evaluate to last statement or expression.');

        analyze(options);

        assert(g.x === 28 && g.x === ref.value,
               'Reuse context');
    });
});


// Recursive eval example
test(() => {
    const g = universalGlobal;

    const options = {
        // Expression ultimately means: 2 * 8 + -1 => 14
        entry: 'x = eval("2 * eval(`8 + eval(\'x\')`)")',
    };

    const eval = function eval(entry) {
        // Base case is to reference only the global variable.
        if (entry === 'x') {
            return -1;
        } else {
            return analyze(Object.assign({}, options, { entry })).value;
        }
    };

    callWithOwnValues(g, { x: -1, eval }, () => {
        analyze(options);
        assert(g.x === 14 && g.x === options.value,
               'Recursively analyze via eval()')
    });
});
