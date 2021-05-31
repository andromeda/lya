'use strict';

var toString = Function.call.bind(Object.prototype.toString);

function isObj(o) {
  return toString(o) === '[object Object]';
}

// Original zipmap
function _zipmap(keys, vals) {
  var shorter = keys.length > vals.length ? vals : keys;

  return shorter.reduce(function(map, val, idx) {
    map[keys[idx]] = vals[idx];
    return map;
  }, {});

}

function zipmapPairs(pairs) {
  return pairs.reduce(function(map, pair) {
    map[pair[0]] = pair[1];
    return map;
  }, {});
}

function zipmapObj(objs) {
  return objs.reduce(function(map, o) {
    map[o.key] = o.value;
    return map;
  }, {});
}

/**
 * Returns a map with the keys mapped to the corresponding vals.
 *
 * @param {array} keys
 * @param {array} [vals]
 *
 * @return {object}
 */
module.exports = function zipmap(keys, vals) {
  if (!vals) {
    if (Array.isArray(keys) && !keys.length) return {};
    if (Array.isArray(keys[0])) return zipmapPairs(keys);
    if (isObj(keys[0])) return zipmapObj(keys);
    throw new TypeError('Expected vals to be an array');
  }

  return _zipmap(keys, vals);
};
