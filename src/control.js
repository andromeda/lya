// Abbreviates non-conventional changes in control flow.

module.exports = {
    failTo,
    withHandlers,
    withCatch,
};

const { assert, test } = require('./test.js');

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

function withHandlers(specs, f) {
    try {
        return f();
    } catch (e) {
        const matching = specs.find((a) => a[0](e));

        if (matching) {
            return matching[1](e);
        } else {
            throw e;
        }
    }
}

test(() => {
    assert(failTo(1, () => raise(2)) === 1,
           'Represent any thrown value as another value');

    assert(withCatch((e) => e === 5, () => raise(5)),
           'Catch a value, then control the apparant return value of another function');

    const handlers = [
        [
            (e) => e === 1,
            (e) => e + 1,
        ],
        [
            (e) => e === 'a',
            (e) => e + 'bc',
        ],
    ];

    assert(withHandlers(handlers, () => raise(1)) === 2 &&
           withHandlers(handlers, () => raise('a')) === 'abc',
           'Match thrown values against handlers');

    assert(withHandlers([[() => true, () => 'caught']],
                        () => withHandlers(handlers, () => raise())) === 'caught',
           'Escalate uncaught values');
});
