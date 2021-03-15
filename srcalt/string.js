module.exports = {
    coerceString
};

const { assert, test } = require('./test.js');
const { failTo, withCatch } = require('./control.js');
const fs = require('fs');

function coerceString(variant) {
    if (fs.existsSync(variant)) {
        return fs.readFileSync(variant).toString();
    } else if (typeof failTo(false, () => variant.toString) === 'function') {
        return variant.toString();
    } else {
        const e = new Error('Cannot coerce string. See .value on this exception.');
        e.value = variant;
        throw e;
    }
}

test(module, () => {
    assert(coerceString("I'm still me") === "I'm still me",
           'Coercing a string is like using the identity function');

    assert(coerceString({}) === "[object Object]",
           '.toString() is the primary means of coercion.');

    assert(withCatch((e) => (e instanceof Error && e.value === null),
                     () => coerceString(null)),
           'Complain about values that cannot be coerced to a string');
});
