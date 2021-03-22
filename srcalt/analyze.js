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

// Called for its effect
function analyze(env) {
    const {
        entry,
        conf,
        pre,
    } = env || {};

    const { vm: vmConfig } = conf || {};

    // A pattern for obtaining the global object regardless of the JS
    // runtime used.
    const g = new Function('return this')();

    const restore = (pre || noop)(g) || noop;
    const code = coerceString(entry, { allowFileRead: true });

    try {
        env.value = vm.runInThisContext(code, vmConfig);
    } catch (e) {
        env.value = e;
    } finally {
        restore();
    }

    return env;
}

// Simple use
test(() => {
    let _g;

    const options = {
        entry: 'x = process.exit(x)',
        pre: (g) => {
            _g = g;

            if (!_g.x) _g.x = 8;

            const original = _g.process.exit;

            _g.process.exit = (v) => {
                return v + 10;
            };

            return () => {
                _g.process.exit = original;
            };
        },
    };

    const ref = analyze(options);

    assert(typeof _g === 'object', 'Capture global');
    assert(ref === options, 'Operate on the input argument');
    assert(_g.x === 18, 'JS affects context object');
    assert(ref.value === 18, 'Evaluate to last statement or expression.');

    analyze(options);

    assert(_g.x === 28 && _g.x === ref.value,
           'Reuse context');
});


// Recursive eval example
test(() => {
    let _g;

    const options = {
        // Expression ultimately means: 2 * 8 + -1 => 14
        entry: 'x = eval("2 * eval(`8 + eval(\'x\')`)")',
        pre: (g) => {
            _g = g;

            const original = g.eval;

            g.eval = function (entry) {
                // Base case is to reference only the global variable.
                if (entry === 'x') {
                    return -1;
                } else {
                    return analyze(Object.assign({}, options, { entry })).value;
                }
            };

            return () => {
                g.eval = original;
            };
        },
    };

    analyze(options);

    assert(_g.x === 14 && _g.x === options.value,
           'Recursively analyze via eval()');
});
