module.exports = {
    callWithOwnValues,
    callWithRedefinedOwnProperty,
    callWithRedefinedOwnPropertyValue,
    deepClone,
    coerceMap,
    elementOf,
    isObject,
    setIntersection,
    merge,
    shallowMerge: (a, b) => Object.assign({}, a, b),
};

const { assertDeepEqual, assert, equal, test } = require('./test.js');
const { identity } = require('./functions.js');
const deepmerge = require('deepmerge');

function merge(...args) {
    if (args.length === 1) {
        return args[0];
    } else if (args.length === 2) {
        return deepmerge(args[0], args[1]);
    } else {
        return deepmerge.all(args);
    }
}


function isObject(v) {
    return (
        !Array.isArray(v) &&
        typeof v === 'object' &&
        Boolean(v)
    );
}

test(() => {
    assert(isObject({}), 'Trivially detect the empty object');
    assert(isObject({a:null}), 'Trivially detect a non-empty object');
    assert(!isObject(null), 'Do not mistake null for more useful objects');
    assert(!isObject([]), 'Do not mistake arrays for more useful objects');
});


function callWithRedefinedOwnProperty(obj, name, desc, f) {
    // Check explicitly against false, because undefined is possible.
    if (desc.configurable === false) {
        throw new Error(
            'callWithRedefinedProperty cannot be used ' +
            'to set any property as unconfigurable.');
    }

    const original = Object.getOwnPropertyDescriptor(obj, name);

    const restore = () => {
        if (original) {
            Object.defineProperty(obj, name, original);
        } else {
            delete obj[name];
        }
    };

    try {
        Object.defineProperty(obj, name, desc);
        const result = f(obj);
        restore();
        return result;
    } catch (e) {
        restore();
        throw e;
    }
}


function callWithRedefinedOwnPropertyValue(obj, name, value, f) {
    const desc = Object.getOwnPropertyDescriptor(obj, name);

    if (desc) {
        if (!('value' in desc)) {
            throw new Error(
                'callWithRedefinedOwnPropertyValue: ' +
                    `Cannot redefine value ${value} for \`${name}\` ` +
                    'on object where property does not hold a value.')
        }

        desc.value = value;
    }

    const override = desc || {
        configurable: true,
        writable: true,
        enumerable: true,
        value,
    };

    return callWithRedefinedOwnProperty(obj, name, override, f);
}


test(() => {
    const nested = { x: 1 };
    const mutable = { a: nested };

    callWithRedefinedOwnPropertyValue(mutable, 'a', 3, (o) => {
        assert(mutable === o,
              'Pass along mutated object reference');

        assert(mutable.a === 3,
              'Redefine property value in context of callback');
    });

    assert(mutable.a === nested,
           'Restore original property once control leaves callback');
});


function callWithOwnValues(obj, diff, f) {
    return (
        Object
            .keys(diff)
            .reduce((reduction, key) => {
                return (o) =>
                    callWithRedefinedOwnPropertyValue(o, key, diff[key], reduction);
            }, f)(obj)
    );
}


test(() => {
    const mutable = { a: 1, b: 2, c: 3 };
    const patch = { a: 4, b: 5, c: 6, d: 7 };

    callWithOwnValues(mutable, patch, (o) => {
        assert(mutable === o,
               'Pass along mutated object reference');

        assertDeepEqual(o, patch,
                        'Redefine many own property values in context of callback');
    });

    assertDeepEqual(mutable, { a: 1, b: 2, c: 3 },
                    'Restore many own properties once control leaves callback');
});


const nonObjectTypes = new Set([
    'undefined',
    'boolean',
    'number',
    'symbol',
    'function',
    'string',
    'number',
]);


function deepClone(variant) {
    if (nonObjectTypes.has(typeof variant) || variant === null) {
        return variant;
    } else if (Array.isArray(variant)) {
        return variant.slice(0);
    } else {
        const obj = variant;
        const output = {};
        const names = Object.getOwnPropertyNames(obj);

        for (const name of names) {
            const desc = Object.getOwnPropertyDescriptor(obj, name);

            if (desc.value && typeof desc.value === 'object' && desc.enumerable) {
                desc.value = deepClone(obj[name]);
            }

            Object.defineProperty(output, name, desc);
        }

        return output;
    }
}

test(() => {
    const mutable = { 1: { 2: { 3: { x: 4 } } } };
    const clone = deepClone(mutable);

    assertDeepEqual(mutable, clone,
                    'Deep clone objects');

    assert(clone !== mutable &&
           clone[1] !== mutable[1] &&
           clone[1][2] !== mutable[1][2] &&
           clone[1][2][3] !== mutable[1][2][3] &&
           clone[1][2][3].x === mutable[1][2][3].x,
           'Do not preserve references in deep clones')
});




// Use this for existential checks in collection types, because there
// are times when the collection itself is optional (therefore false-y).
function elementOf(variant, element) {
    if (!variant) {
        return false;
    } else if (variant instanceof Array) {
        return variant.includes(element);
    } else if (typeof variant.has === 'function') { // Map, WeakMap, Set
        return variant.has(element);
    } else {
        return elementOf(Array.from(variant), element);
    }
}


test(() => {
    const elements = [1, 2, 3];
    const lastElement = elements[elements.length - 1];
    const notPresent = 4;
    const set = new Set(elements);
    const map = new Map(elements.map((v) => [v,v]));
    const generator = function* () { yield* elements };

    assert(!elementOf(null, lastElement) && !elementOf(undefined, lastElement),
          'Find no element in a false-y value');

    assert(elementOf(elements, lastElement),
          'Find element in array');

    assert(!elementOf(elements, notPresent),
           'Fail to find element in array');

    assert(elementOf(set, lastElement),
           'Find element in Set');

    assert(!elementOf(set, notPresent),
           'Fail to find element in Set');

    assert(elementOf(generator(), lastElement),
           'Find element in iterable');

    assert(!elementOf(generator(), notPresent),
           'Fail to find element in iterable');

    assert(elementOf(map, lastElement),
           'Find element in Map');

    assert(!elementOf(map, notPresent),
           'Fail to find element in Map');
});


function coerceMap(iterable, { weak, makeKey = identity, makeValue = noop }) {
    return Array.from(iterable).reduce((reduction, el) =>
                                       (reduction.set(makeKey(el), makeValue(el)), reduction),
                                       new (weak ? WeakMap : Map)());

}

test(() => {
    const actual = coerceMap(['a', 'b', 'c'], {
        weak: false,
        makeValue: (s) => s.toUpperCase(),
    });

    assert(actual instanceof Map,
           'Produce a Map by default');

    assert(equal(Array.from(actual.entries()).sort(([[a,],[b,]]) => a.localeCompare(b)),
                 [['a', 'A'], ['b', 'B'], ['c', 'C']]),
           'Allow user-defined values for keys');
});



function filterObject(obj, keep) {
    return Object
        .entries(obj)
        .filter(keep)
        .reduce((reduction, [k,v]) => Object.assign(reduction, { [k]: v }), {});
}

test(() => {
    assert(equal(filterObject({ a: 1, b: 2, c: 3, d: 4 }, ([k, v]) => v < 3), { a: 1, b: 2 }),
           'Filter objects by keys')
});


function setIntersection (a, b) {
    const intersection = new Set();

    for (const element of b) {
      if (a.has(element)) {
        intersection.add(element);
      }
    }

    return intersection;
};

test(() => {
    assert(equal(setIntersection(new Set([1,2,3,4,5]), new Set([9,8,7,6,5,4])), new Set([4,5])),
           'Find set intersection')
});
