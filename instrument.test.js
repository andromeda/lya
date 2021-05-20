const instrument = require('./instrument.js');
const {
  testDeepEqual,
} = require('./test.js');

testDeepEqual(
  instrument.equipCallExpression({
    type: 'CallExpression',
    callee: {
      type: 'Identifier',
      name: 'f',
    },
    arguments: [
      {
        type: 'Literal',
        value: 1,
        raw: '1',
      },
      {
        type: 'Literal',
        value: "abc",
        raw: '"abc"',
      },
    ],
  }),
  {
    injectProperties: {
      target: 'f',
      args: '[1,"abc"]',
    },
  });
