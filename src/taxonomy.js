// Group well-known identifiers.

module.exports = {
  classify,
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

const lookup = [
  [new Set(globalsEs), 'es-globals'],
  [new Set(globalsNode), 'node-globals'],
  [new Set(globalsOther), 'other-globals'],
  [new Set(localsNode), 'node-module-locals'],
];

function classify(k) {
  return (lookup.find(([set,]) => set.has(k)) || [])[1];
}

const { test, assert } = require('./test.js');

test(() => {
  const cases = [
    [globalsEs, 'es-globals'],
    [globalsNode, 'node-globals'],
    [globalsOther, 'other-globals'],
    [localsNode, 'node-module-locals'],
  ];

  for (const [names, typeClass] of cases) {
    assert(names.every(n => classify(n) === typeClass),
           `Classify ${typeClass}`);
  }
})
