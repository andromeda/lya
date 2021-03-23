module.exports = {
    identity,
    lets,
    noop,
    cloneFunction,
};

const { assertDeepEqual, assert, equal, test } = require('./test.js');

// Lisp-like syntactic sugar for introducing values to new scopes.
// This can ease reading for IIFEs where the argument follows a long
// function definition.
//
// Avoid using the spread operator here. That adds a performance
// penalty for something that is plenty flexible already.
function lets(a, f) {
    return f(a);
}

test(() =>
     lets([1, 2, {c: 3}], ([a, b, {c}]) =>
          assert(a === 1 && b === 2 && c === 3,
                 'Bind values using lets()')))

function identity(v) {
    return v;
}

function noop() {
}

// Makes a function (as a value) non-equal to any other value.
function cloneFunction(f, name) {
    const _f = function(...args) {
        if (new.target) {
            // eslint-disable-next-line new-cap
            return new f(...args);
        } else {
            return f.call(this, ...args);
        }
    };

    Object.defineProperty(_f, 'name', { value: name || f.name });

    return _f;
}

test(() => {
    assert(noop() === undefined,
           'Do nothing.')

    assert(identity(identity) === identity,
           'Return the same reference using identity().');

    const clone = cloneFunction(identity);
    assert(clone !== identity && clone(clone) === clone,
           'Create new function references');
});


function createUnaryCodomainSubset(args, f) {
    return args.reduce(
        (reduction, arg) =>
            Object.assign(reduction, { [arg]: f(arg) }), {});
}

test(() => {
    assertDeepEqual(
        createUnaryCodomainSubset([1, 2, 3], (v) => v * 2),
        { 1: 2, 2: 4, 3: 6 },
        'Create object mapping domain elements to codomain elements for unary functions');
});
