'use strict';

const Schema = require('map-schema');
const normalizers = require('./normalizers');
const validators = require('./validators');
const utils = require('./utils');
const keys = require('./keys');

/**
 * Normalize package.json using a schema.
 */

module.exports = options => {
  const opts = Object.assign({}, options);
  const omit = utils.arrayify(opts.omit);
  const config = Object.assign({}, opts, { keys: keys, omit: omit });

  const schema = new Schema(config)
    .field('name', ['string'], {
      validate: validators.name,
      normalize: normalizers.name,
      required: true
    })
    .field('private', 'boolean')
    .field('description', 'string')
    .field('version', 'string', {
      validate: validators.version,
      default: '0.1.0',
      required: true
    })
    .field('homepage', 'string', {
      normalize: normalizers.homepage
    })

    /**
     * Person fields
     */

    .field('author', ['object', 'string'], { normalize: normalizers.person })
    .field('authors', 'array', { normalize: normalizers.person })
    .field('maintainers', 'array', { normalize: normalizers.person })
    .field('contributors', 'array', { normalize: normalizers.person })
    .field('collaborators', 'array', { normalize: normalizers.person })

    /**
     * Bugs, repo and license
     */

    .field('bugs', ['object', 'string'], {
      normalize: normalizers.bugs
    })
    .field('repository', ['object', 'string'], {
      normalize: normalizers.repository
    })
    .field('license', 'string', {
      normalize: normalizers.license,
      default: 'MIT'
    })
    .field('licenses', ['array', 'object'], {
      normalize: normalizers.licenses,
      validate: validators.licenses
    })

    /**
     * Files, main
     */

    .field('files', 'array', {
      normalize: normalizers.files
    })
    .field('main', 'string', {
      normalize: normalizers.main,
      validate: function(filepath) {
        return utils.exists(filepath);
      }
    })
    .field('types', 'string', {
      normalize: normalizers.typings
    })
    .field('typings', 'string', {
      normalize: normalizers.typings
    })

    /**
     * Scripts, binaries and related
     */

    .field('preferGlobal', 'boolean', {
      validate: validators.preferGlobal
    })
    .field('bin', ['object', 'string'], {
      normalize: normalizers.bin
    })
    .field('scripts', 'object', {
      normalize: normalizers.scripts
    })

    /**
     * Engine
     */

    .field('engines', 'object', {
      default: { node: '>= 0.10.0' }
    })
    .field('engine-strict', 'boolean', {
      validate: validators['engine-strict']
    })
    .field('engineStrict', 'boolean', {
      normalize: normalizers.engineStrict
    })

    /**
     * Dependencies
     */

    .field('dependencies', 'object')
    .field('devDependencies', 'object')
    .field('peerDependencies', 'object')
    .field('optionalDependencies', 'object')

    /**
     * Project metadata
     */

    .field('man', ['array', 'string'])
    .field('keywords', 'array', {
      normalize: normalizers.keywords
    });

  // Add fields defined on `options.fields`
  schema.addFields(opts);
  return schema;
};
