// Abbreviates non-conventional changes in control flow.

module.exports = {
  failTo,
  raise,
  withCatch,
};

const {assert, test} = require('./test.js');

// Allows throw to be used in expression position.
function raise(v) {
  throw v;
}

function failTo(v, f) {
  return withCatch(() => v, f);
}

function withCatch(c, f) {
  try {
    return f();
  } catch (e) {
    return c(e);
  }
}

test(() => {
  assert(failTo(1, () => raise(2)) === 1,
      'Represent any thrown value as another value');

  assert(withCatch((e) => e === 5, () => raise(5)),
      'Catch a value, then control the apparant return value of another function');
});
