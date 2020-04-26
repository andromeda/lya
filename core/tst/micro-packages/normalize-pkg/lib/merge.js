'use strict';

const keys = require('./keys');
const { pick, merge } = require('./utils');

module.exports = function(config, schema) {
  if (schema.isMerged) return;

  schema.checked = schema.checked || {};
  schema.isMerged = true;

  // shallow clone schema.data
  const schemaOpts = pick(schema.options, keys);
  const data = Object.assign({}, schema.data);
  const obj = merge({}, config, data, schemaOpts);
  merge(config, obj);
};
