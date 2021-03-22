module.exports = {
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
