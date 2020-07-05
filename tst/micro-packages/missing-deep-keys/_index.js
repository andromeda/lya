const deepKeys = require('deep-keys');
const difference = require('lodash.difference');

module.exports = function(o1, o2, showIntermediate) {
  o1 = o1 || {};
  o2 = o2 || {};
  showIntermediate = showIntermediate || false;

  return difference(
    deepKeys(o1, showIntermediate),
    deepKeys(o2, showIntermediate)
  );
};
