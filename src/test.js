/*
Provide a testing experience similar to Racket test submodules, while
allowing for a different trigger for tests when needed.

Benefits:

1. Brings tests close to the the test subjects, making it easier to
   remember to update tests.

2. Validating a module just means running it. Allows for productive
   use of commands like `watch -n 1 node module.js`, or a hotkey in
   their editor.

3. New teammates can see examples of how functions are used as
   actual working code.
*/

module.exports = {
  assert,
  assertDeepEqual,
  allege,
  equal,
  test,
};

const fastDeepEqual = require('fast-deep-equal/es6');

function assert(bool, message = '') {
  allege(bool, message);
  if (!bool) throw new Error('Assertion failed.');
}

function assertDeepEqual(actual, expected, message = '') {
  const bool = equal(actual, expected);
  allege(bool, message);

  if (!bool) {
    throw new Error(
        `Expected deep equality\n` +
            `expected: ${JSON.stringify(expected, null, 4)}\n\n` +
            `actual: ${JSON.stringify(actual, null, 4)}\n`
    );
  }
}

function allege(bool, message = '') {
  console.log(`${bool ? 'PASS' : 'FAIL'}: ${message || '<no message set>'}`);
}

function equal(a, b) {
  return fastDeepEqual(a, b);
}

function test(f) {
  if (process.env.LYA_TEST === '1') {
    // Injecting test library allows user to select which tests
    // get which bindings.
    f(module.exports);
  }
}

test(({assert: _assert, allege: _allege}) => {
  assert(assert === _assert && allege === _allege,
      'Inject core library functions');

  assert(true, 'I\'ve been used!');
  allege(false, 'Allegations do not halt tests when false.');

  assert(equal({a: 1, b: {c: 3}}, {a: 1, b: {c: 3}}),
      'Deeply compare objects');

  assert(equal([1, [2], [[3]]], [1, [2], [[3]]]),
      'Deeply compare arrays');

  assert(equal(new Map([[1, 2], ['key', {a: {b: {c: [['deep']]}}}]]),
      new Map([[1, 2], ['key', {a: {b: {c: [['deep']]}}}]])),
  'Deeply compare maps');

  // Deep comparison does not appear to work for sets.
  assert(equal(new Set([1]), new Set([1])),
      'Shallow compare sets');

  try {
    assert(false);
    console.log('You should not see this message.');
  } catch (e) {
    console.log('Failed assertion changed control flow. Test library works fine.');
  }
});
