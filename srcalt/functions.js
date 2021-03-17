module.exports = {
    identity,
    noop,
    cloneFunction,
};

const { test } = require('./test.js');

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

test(({ assert }) => {
    assert(noop() === undefined,
           'Do nothing.')

    assert(identity(identity) === identity,
           'Return the same reference using identity().');

    const clone = cloneFunction(identity);
    assert(clone !== identity && clone(clone) === clone,
           'Create new function references');
});
