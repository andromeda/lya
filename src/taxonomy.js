// Group well-known identifiers.

module.exports = {
  classify,
  IDENTIFIER_CLASSIFICATIONS: new Proxy({
    // e.g. global.x, x
    USER_GLOBALS: 'user-globals',

    // e.g. console, process
    NODE_GLOBALS: 'node-globals',

    // e.g. setImmediate, eval
    ES_GLOBALS: 'es-globals',

    // For other environments, e.g. browser, Adobe plugin, ...
    OTHER_GLOBALS: 'other-globals',

    // e.g. exports, require, module, __filename, __dirname
    CJS_ARGUMENTS: 'cjs-module-arguments',

    // Just exports and module.exports
    CJS_EXPORTS: 'cjs-module-exports',
  }, {
    get: (target, prop) => {
      if (!target[prop])
        throw new Error(`${prop} is not an identifier classification. Typo?`);
      return target[prop];
    },
    set: () => false,
  })
};


const {
  globals: {
    es: globalsEs,
    node: globalsNode,
    other: globalsOther,
  },
  locals: {
    node: localsNode,
  }
} = require('./default-names.json');

const { IDENTIFIER_CLASSIFICATIONS: I } = module.exports;


const lookup = [
  [new Set(globalsEs), I.ES_GLOBALS],
  [new Set(globalsNode), I.NODE_GLOBALS],
  [new Set(globalsOther), I.OTHER_GLOBALS],
  [new Set(localsNode), I.CJS_ARGUMENTS],
];

function classify(k) {
  return (lookup.find(([set,]) => set.has(k)) || [])[1];
}

const { test, assert } = require('./test.js');

test(() => {
  const cases = lookup.map(([s,c]) => [Array.from(s), c]);
  for (const [names, typeClass] of cases) {
    assert(names.every(n => classify(n) === typeClass),
           `Classify ${typeClass}`);
  }
})
