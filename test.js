module.exports = {
  assert,
  assertNoError,
  assertError,
  assertAnyError,
  equal,
  test,
  testEqual,
  testDeepEqual,
};

const failure = Symbol('Assertion Failure');
const stack = [];
const fastDeepEqual = require('fast-deep-equal/es6');

function assert(bool) {
  if (!bool) throw failure;
}

function assertNoError(thunk) {
  try {
    thunk();
    assert(true);
  } catch (e) {
    test(e.stack, () => assert(false));
  }
}

function assertError(isCorrectError, thunk) {
  try {
    thunk();
    assert(false);
  } catch (e) {
    assert(isCorrectError(e));
  }
}

function assertAnyError(thunk) {
  assertError(() => true, thunk);
}

function testDeepEqual(actual, expected) {
  test(`Expected deep equality\n` +
       `expected: ${JSON.stringify(expected, null, 4)}\n\n` +
       `actual: ${JSON.stringify(actual, null, 4)}\n`,
       () => assert(equal(actual, expected)))
}

function testEqual(actual, expected) {
  test(`${actual} === ${expected}`,
       () => assert(actual === expected))
}

function equal(a, b) {
  return fastDeepEqual(a, b);
}

function test(message, f) {
  try {
    stack.push(message);
    f();
    console.log('PASS:', stack.join(' > '));
  } catch (e) {
    console.log('FAIL:', stack.join(' > '), e);
    throw e;
  } finally {
    stack.pop();
  }
}
