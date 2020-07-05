'use strict';

const path = require('path');
const Events = require('events');
const schema = require('./lib/schema');
const utils = require('./lib/utils');

/**
 * Create an instance of `NormalizePkg` with the given `options`.
 *
 * ```js
 * const config = new NormalizePkg();
 * const pkg = config.normalize({
 *   author: {
 *     name: 'Jon Schlinkert',
 *     url: 'https://github.com/jonschlinkert'
 *   }
 * });
 * console.log(pkg);
 * //=> {author: 'Jon Schlinkert (https://github.com/jonschlinkert)'}
 * ```
 * @param {Object} `options`
 * @api public
 */

class NormalizePkg extends Events {
  constructor(options) {
    super();
    this.options = { ...options };
    this.schema = schema(this.options);
    this.data = this.schema.data;
    this.schema.on('warning', this.emit.bind(this, 'warning'));
    this.schema.on('error', this.emit.bind(this, 'error'));

    this.schema.union = (key, config, arr) => {
      config[key] = utils.arrayify(config[key]);
      config[key] = utils.union([], config[key], utils.arrayify(arr));
    };
  }

  /**
   * Add a field to the schema, or overwrite or extend an existing field. The last
   * argument is an `options` object that supports the following properties:
   *
   * - `normalize` **{Function}**: function to be called on the value when the `.normalize` method is called
   * - `default` **{any}**: default value to be used when the package.json property is undefined.
   * - `required` **{Boolean}**: define `true` if the property is required
   *
   * ```js
   * const config = new NormalizePkg();
   *
   * config.field('foo', 'string', {
   *   default: 'bar'
   * });
   *
   * const pkg = config.normalize({});
   * console.log(pkg);
   * //=> {foo:  'bar'}
   * ```
   *
   * @param {String} `name` Field name (required)
   * @param {String|Array} `type` One or more native javascript types allowed for the property value (required)
   * @param {Object} `options`
   * @return {Object} Returns the instance
   * @api public
   */

  field(field, type, options) {
    if (typeof options === 'function') {
      options = { normalize: options };
    }
    options = options || {};
    if (options.extend === true) {
      options = utils.merge({}, this.schema.get(field), options);
    }
    this.schema.field(field, type, options);
    return this;
  }

  /**
   * Iterate over `pkg` properties and normalize values that have corresponding
   * [fields](#field) registered on the schema.
   *
   * ```js
   * const config = new NormalizePkg();
   * const pkg = config.normalize(require('./package.json'));
   * ```
   * @param {Object} `pkg` The `package.json` object to normalize
   * @param {Object} `options`
   * @return {Object} Returns a normalized package.json object.
   * @api public
   */

  normalize(pkg, options) {
    if (typeof pkg === 'undefined') {
      pkg = path.resolve(process.cwd(), 'package.json');
    }
    if (typeof pkg === 'string') {
      pkg = utils.requirePackage(pkg);
    }

    if (options && options.fields) {
      const fields = options.fields;
      delete options.fields;

      for (const key in fields) {
        if (fields.hasOwnProperty(key)) {
          const val = utils.merge({}, options, fields[key]);
          this.field(key, val.type, val);
        }
      }
    }

    this.schema.options = utils.merge({}, this.schema.options, options);
    const obj = this.schema.normalize(pkg, this.schema.options);
    this.schema.emit('normalized', obj);
    this.emit('normalized', obj);
    return obj;
  }
}

/**
 * NormalizePkg
 */

module.exports = NormalizePkg;
