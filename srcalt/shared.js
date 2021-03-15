const { test } = require('./test.js');


// Use this for existential checks in collection types, because there
// are times when the collection itself is optional (therefore false-y).
const elementOf = (variant, name) => {
    if (!variant) {
        return false;
    } else if (variant instanceof Array) {
        return variant.includes(name);
    } else if (typeof variant.has === 'function') { // Map, WeakMap, Set
        return variant.has(name);
    } else {
        return elementOf(Array.from(variant), name);
    }
}


const coerceMap = (iterable, { weak, makeKey = identity, makeValue = noop }) =>
      Array.from(iterable).reduce((reduction, el) =>
                                  (reduction.set(makeKey(el), makeValue(el)), reduction),
                                  new (weak ? WeakMap : Map)());

test(module, ({ assert, equal }) => {
    const actual = coerceMap(['a', 'b', 'c'], {
        weak: false,
        makeValue: (s) => s.toUpperCase(),
    });

    assert(actual instanceof Map,
           'Produce a Map by default');

    assert(equal(Array.from(actual.values()).sort(),
                 [['a', 'A'], ['b', 'B'], ['c', 'C']])
           'Allow user-defined values for keys'); 
});



const getObjectKeys = (obj) => {
    if (Object.keys(obj).length) {
        return Object.keys(obj);
    } else {
        return Object.getOwnPropertyNames(obj);
    }
}

const filterObject(obj, keep) =>
      Object.fromEntries(
          Object
              .entries(obj)
              .filter(keep));

const setIntersection = (a, b) => {
    const intersection = new Set();

    for (const element of b) {
      if (a.has(element)) {
        intersection.add(element);
      }
    }
    
    return intersection;
};


module.exports = {
    coerceString,
    coerceMap,
    elementOf,
    getObjectKeys,
    setIntersection,
    shallowMerge: (a, b) => Object.assign({}, a, b),
};
