#! /usr/bin/env node

// A front-end for Node.js' vm module such that one object acts as a
// JS virtual machine state.

module.exports = {
  analyze,
};


const fs = require('fs');
const vm = require('vm');
const {coerceString} = require('./string.js');
const {assert, test} = require('./test.js');


// Called for its effect
function analyze(env) {
  const {
    entry,
    context: contextVariant,
    conf,
  } = env || {};

  const {
    context: contextConfig,
    vm: vmConfig,
  } = conf || {};

  const code = coerceString(entry, {allowFileRead: true});

  env.context = vm.isContext(contextVariant) ?
        contextVariant :
        vm.createContext(contextVariant, contextConfig);

  env.value = vm.runInContext(code, env.context, vmConfig);

  return env;
}

// Simple use
test(() => {
  const options = {
    entry: 'x = process.exit(x)',
    context: {
      x: 0,
      process: {
        exit: (v) => v + 10,
      },
    },
  };

  const ref = analyze(options);

  assert(ref === options, 'Operate on the input argument');
  assert(ref.context.x === 10, 'JS affects context object');
  assert(ref.value === 10, 'Evaluate to last statement or expression.');

  analyze(options);

  assert(ref.context.x === 20 && ref.context.x === ref.value,
      'Reuse context');
});


// Recursive eval example
test(() => {
  const options = {
    // Expression ultimately means: 2 * 8 + -1 => 14
    entry: 'x = eval("2 * eval(`8 + eval(\'x\')`)")',
    context: {
      eval: (entry) => {
        // Base case is to reference only the global variable.
        if (entry === 'x') {
          return -1;
        } else {
          return analyze(Object.assign({}, options, {entry})).value;
        }
      },
    },
  };

  analyze(options);

  assert(options.context.x === 14 && options.context.x === options.value,
      'Recursively analyze via eval()');
});
