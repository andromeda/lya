module.exports = {
  callWithOwnValues,
  deepClone,
  elementOf,
  isObject,
  merge,
  shallowMerge: (a, b) => Object.assign({}, a, b),
};

const {assertDeepEqual, assert, test} = require('./test.js');
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
  assert(isObject({a: null}), 'Trivially detect a non-empty object');
  assert(!isObject(null), 'Do not mistake null for more useful objects');
  assert(!isObject([]), 'Do not mistake arrays for more useful objects');
});

function callWithOwnPropertyValue(obj, name, value, f) {
  const defined = Object.getOwnPropertyDescriptor(obj, name);
  const original = obj[name];

  const restore = () => {
    if (defined) {
      obj[name] = original;
    } else {
      delete obj[name];
    }
  };

  try {
    obj[name] = value;
    const result = f(obj);
    restore();
    return result;
  } catch (e) {
    restore();
    throw e;
  }
}


function callWithOwnValues(obj, diff, f) {
  return (
    Object
        .keys(diff)
        .reduce((reduction, key) => {
          return (o) =>
            callWithOwnPropertyValue(o, key, diff[key], reduction);
        }, f)(obj)
  );
}


test(() => {
  const mutable = {a: 1, b: 2, c: 3};
  const patch = {a: 4, b: 5, c: 6, d: 7};

  callWithOwnValues(mutable, patch, (o) => {
    assert(mutable === o,
        'Pass along mutated object reference');

    assertDeepEqual(o, patch,
        'Redefine many own property values in context of callback');
  });

  assertDeepEqual(mutable, {a: 1, b: 2, c: 3},
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
  const mutable = {1: {2: {3: {x: 4}}}};
  const clone = deepClone(mutable);

  assertDeepEqual(mutable, clone,
      'Deep clone objects');

  assert(clone !== mutable &&
           clone[1] !== mutable[1] &&
           clone[1][2] !== mutable[1][2] &&
           clone[1][2][3] !== mutable[1][2][3] &&
           clone[1][2][3].x === mutable[1][2][3].x,
  'Do not preserve references in deep clones');
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
  const map = new Map(elements.map((v) => [v, v]));
  const generator = function* () {
    yield* elements;
  };

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
