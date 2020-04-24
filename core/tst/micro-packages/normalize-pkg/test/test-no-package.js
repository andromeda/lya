'use strict';

require('mocha');
const path = require('path');
const assert = require('assert');
const del = require('delete');
const createRepo = require('./support/git');
const Normalizer = require('..');
let config;

const origCwd = process.cwd();
const remote = 'https://github.com/jonschlinkert/project-no-package.git';
const project = path.resolve(__dirname, 'fixtures/project-no-package');
const gitPath = path.resolve(project, '.git');

describe('normalize (no package.json)', () => {
  beforeEach(() => {
    config = new Normalizer({ verbose: false });
  });

  before(function(cb) {
    process.chdir(project);
    createRepo(project, remote, cb);
  });

  after(function(cb) {
    process.chdir(origCwd);
    del(gitPath, cb);
  });

  describe('omit', () => {
    it('should remove a field on options.omit', () => {
      config = new Normalizer({ omit: 'version' });
      const res = config.normalize({});
      assert.equal(typeof res.version, 'undefined');
    });

    it('should remove an array of fields on options.omit', () => {
      config = new Normalizer({ omit: ['version', 'main'] });
      const res = config.normalize({});
      assert.equal(typeof res.version, 'undefined');
      assert.equal(typeof res.main, 'undefined');
    });
  });

  describe('defaults', () => {
    it('should add default properties to config', () => {
      const res = config.normalize({});
      assert.equal(res.name, 'project-no-package');
      assert.equal(res.version, '0.1.0');
    });
  });

  describe('name', () => {
    it('should use the defined project name', () => {
      const pkg = { name: 'foo' };
      const res = config.normalize(pkg);
      assert(res.name);
      assert.equal(res.name, 'foo');
    });

    it('should get the project name when string is empty', () => {
      const pkg = { name: '' };
      const res = config.normalize(pkg);
      assert(res.name);
      assert.equal(res.name, 'project-no-package');
    });

    it('should get the project name when missing', () => {
      const pkg = {};
      const res = config.normalize(pkg);
      assert(res.name);
      assert.equal(res.name, 'project-no-package');
    });

    it('should use the normalize function defined on options', () => {
      const pkg = { name: 'foo' };
      const opts = {
        fields: {
          name: {
            type: ['string'],
            normalize: function custom() {
              return 'bar';
            }
          }
        }
      };

      const res = config.normalize(pkg, opts);
      assert(res.name);
      assert.equal(res.name, 'bar');
    });
  });

  describe('version', () => {
    it('should use the given version', () => {
      const pkg = { version: '1.0.0' };
      const res = config.normalize(pkg);
      assert(res.version);
      assert.equal(res.version, '1.0.0');
    });

    it('should use the default version', () => {
      const pkg = { version: '' };
      const res = config.normalize(pkg);
      assert(res.version);
      assert.equal(res.version, '0.1.0');
    });

    it('should emit a warning when version type is invalid', cb => {
      const pkg = { version: 5 };
      let count = 0;

      config.on('warning', function(method, key, err) {
        if (key === 'version') {
          count++;
        }
      });

      config.normalize(pkg);
      assert.equal(count, 1);
      cb();
    });

    it('should throw an error when version is invalid', cb => {
      const pkg = { version: 'foo' };
      try {
        config.normalize(pkg);
        cb(new Error('expected an error'));
      } catch (err) {
        assert(/invalid semver/.test(err.message));
        cb();
      }
    });
  });

  describe('main', () => {
    it('should remove the property if the file does not exist', () => {
      const pkg = { main: 'foo.js' };
      const res = config.normalize(pkg);
      assert(!res.hasOwnProperty('main'));
    });

    it('should not remove the property if the file exists', () => {
      const pkg = { main: 'main.js' };
      const res = config.normalize(pkg);
      assert(res.hasOwnProperty('main'));
    });

    it('should add the main file to the `files` array', () => {
      const pkg = { main: 'main.js' };
      const res = config.normalize(pkg);
      assert.equal(res.files.indexOf('main.js'), 0);
    });

    it('should not add main file to files array when main file does not exist', () => {
      const pkg = {
        files: [],
        main: 'index.js'
      };

      const res = config.normalize(pkg);
      assert(!res.hasOwnProperty('files'));
    });

    it('should add main file to files array if files array is empty', () => {
      const pkg = {
        files: [],
        main: 'main.js'
      };

      const res = config.normalize(pkg);
      assert.equal(res.files.length, 1);
      assert.equal(res.files[0], 'main.js');
    });

    it('should create files array with main if undefined', () => {
      const pkg = {
        main: 'main.js'
      };

      const res = config.normalize(pkg);
      assert(res.files.length);
      assert(res.files.indexOf('main.js') !== -1);
    });

    it('should not double add the file to files', () => {
      const pkg = {
        files: ['main.js'],
        main: 'main.js'
      };

      const res = config.normalize(pkg);
      assert.equal(res.files.length, 1);
      assert(res.files.indexOf('main.js') !== -1);
    });

    it('should remove main if the file does not exist', () => {
      const pkg = { main: 'foo.js' };

      const res = config.normalize(pkg);
      assert(!res.main);
    });

    it('should do nothing if not defined', () => {
      const pkg = {};

      const res = config.normalize(pkg);
      assert.equal(typeof res.main, 'undefined');
    });
  });

  describe('files', () => {
    it('should remove a file if it does not exist', () => {
      const pkg = { files: ['foo.js', 'main.js'] };
      const res = config.normalize(pkg);
      assert.equal(res.files.length, 1);
    });

    it('should remove the files array if it\'s empty', () => {
      const pkg = { files: [] };
      const res = config.normalize(pkg);
      assert(!res.files);
    });

    it('should remove the files array if a file that does not exist is removed', () => {
      const pkg = { files: ['foo.js'] };
      const res = config.normalize(pkg);
      assert(!res.files);
    });
  });

  describe('homepage', () => {
    it('should add a homepage from git repository', () => {
      const res = config.normalize({});
      assert(res.homepage);
      assert.equal(res.homepage, 'https://github.com/jonschlinkert/project-no-package');
    });

    it('should add repository when setting homepage', () => {
      const res = config.normalize({});
      assert(res.homepage);
      assert.equal(res.repository, 'jonschlinkert/project-no-package');
    });

    it('should use the given homepage', () => {
      const pkg = { homepage: 'https://github.com/assemble/assemble' };
      const res = config.normalize(pkg);
      assert(res.homepage);
      assert.equal(res.homepage, 'https://github.com/assemble/assemble');
    });

    it('should get homepage from repository.url', () => {
      const pkg = {
        homepage: '',
        repository: 'git://github.com/jonschlinkert/project-no-package.git'
      };

      const res = config.normalize(pkg);
      assert(res.homepage);
      assert.equal(res.homepage, 'https://github.com/jonschlinkert/project-no-package');
    });
  });

  describe('author', () => {
    it('should not add an empty author field', () => {
      const res = config.normalize({});
      assert(!res.hasOwnProperty('author'));
    });

    it('should return an author string as is', () => {
      const pkg = { author: 'Jon Schlinkert' };
      const res = config.normalize(pkg);
      assert.equal(res.author, 'Jon Schlinkert');
    });

    it('should convert an author object to a string', () => {
      const pkg = {
        author: {
          name: 'Jon Schlinkert',
          url: 'https://github.com/jonschlinkert'
        }
      };

      const res = config.normalize(pkg);
      assert.equal(res.author, 'Jon Schlinkert (https://github.com/jonschlinkert)');
    });
  });

  describe('maintainers', () => {
    it('should not add an empty maintainers field', () => {
      const res = config.normalize({});
      assert(!res.hasOwnProperty('maintainers'));
    });
  });

  describe('license', () => {
    it('should add MIT as the default license', () => {
      const res = config.normalize({});
      assert(res.hasOwnProperty('license'));
      assert.equal(res.license, 'MIT');
    });

    it('should return license as is if it is a string', () => {
      const res = config.normalize({ license: 'MIT' });
      assert(res.hasOwnProperty('license'));
      assert.equal(res.license, 'MIT');
    });

    it('should convert from an object to a string', () => {
      const res = config.normalize({ license: { type: 'MIT' } });
      assert(res.hasOwnProperty('license'));
      assert.equal(res.license, 'MIT');
    });

    it('should convert from an array to a string', () => {
      const res = config.normalize({ license: [{ type: 'MIT' }] });
      assert(res.hasOwnProperty('license'));
      assert.equal(res.license, 'MIT');
    });
  });

  describe('people', () => {
    beforeEach(() => {
      config = new Normalizer({ verbose: false });
    });

    describe('contributors', () => {
      it('should not add an empty contributors field', () => {
        const res = config.normalize({});
        assert(!res.hasOwnProperty('contributors'));
      });

      it('should stringify authors', () => {
        const pkg = {
          contributors: [{
            name: 'Jon Schlinkert',
            url: 'https://github.com/jonschlinkert'
          }]
        };

        const res = config.normalize(pkg);
        assert.equal(res.contributors[0], 'Jon Schlinkert (https://github.com/jonschlinkert)');
      });
    });
  });

  describe('repository', () => {
    it('should use the given repository', () => {
      const pkg = { repository: 'jonschlinkert/foo' };
      const res = config.normalize(pkg);
      assert(res.repository);
      assert.equal(res.repository, 'jonschlinkert/foo');
    });

    it('should use the git remote url', () => {
      const pkg = { repository: '' };
      const res = config.normalize(pkg);
      assert(res.repository);
      assert.equal(res.repository, 'jonschlinkert/project-no-package');
    });

    it('should convert repository.url to a string', () => {
      const pkg = { repository: { url: 'https://github.com/jonschlinkert/foo.git' } };
      const res = config.normalize(pkg);
      assert(res.repository);
      assert.equal(res.repository, 'jonschlinkert/foo');
    });
  });

  describe('bugs', () => {
    beforeEach(() => {
      config = new Normalizer({ verbose: false });
    });

    it('should return bugs value ', () => {
      const pkg = { bugs: { url: 'jonschlinkert/foo' } };

      const res = config.normalize(pkg);
      assert(res.bugs);
      assert.equal(res.bugs.url, 'https://github.com/jonschlinkert/foo/issues');
    });

    it('should use the given bugs value', () => {
      const opts = { bugs: { url: 'jonschlinkert/foo' } };
      const res = config.normalize({}, opts);
      assert(res.bugs);
      assert.equal(res.bugs.url, 'https://github.com/jonschlinkert/foo/issues');
    });

    it('should use the value function passed on options', () => {
      const pkg = { bugs: '' };
      const res = config.normalize(pkg, {
        fields: {
          bugs: {
            type: ['string', 'object'],
            normalize: function custom() {
              return { url: 'abc' };
            }
          }
        }
      });
      assert(res.bugs);
      assert.equal(res.bugs.url, 'abc');
    });

    it('should use a custom type passed on options', () => {
      const pkg = { bugs: '', repository: 'https://github.com/foo' };
      const res = config.normalize(pkg, {
        extend: false,
        fields: {
          bugs: {
            type: ['object', 'string'],
            normalize: function custom(key, val, config, schema) {
              schema.update('repository', config);
              const bugs = {};
              bugs.url = config.repository + '/bugs';
              return bugs;
            }
          }
        }
      });

      assert.equal(typeof res.bugs, 'object');
      assert(res.bugs.url);
      assert.equal(res.bugs.url, 'https://github.com/foo/bugs');
    });

    it('should convert bugs.url to a string when specified', () => {
      const pkg = { bugs: { url: 'https://github.com/jonschlinkert/foo.git' } };
      const res = config.normalize(pkg, {
        extend: false,
        fields: {
          bugs: {
            type: 'string',
            normalize: function(val, key, config) {
              return val.url;
            }
          }
        }
      });
      assert(res.bugs);
      assert.equal(res.bugs, 'https://github.com/jonschlinkert/foo.git');
    });
  });

  describe('license', () => {
    beforeEach(() => {
      config = new Normalizer({ verbose: false });
    });

    it('should convert a license object to a string', () => {
      const pkg = {
        license: {
          type: 'MIT',
          url: 'https://github.com/jonschlinkert/project-no-package/blob/master/LICENSE-MIT'
        }
      };

      const res = config.normalize(pkg);
      assert.equal(typeof res.license, 'string');
      assert.equal(res.license, 'MIT');
    });
  });

  describe('licenses', () => {
    beforeEach(() => {
      config = new Normalizer({ verbose: false });
    });

    it('should emit a deprecation warning when licenses is defined', cb => {
      const pkg = { licenses: { type: 'MIT' } };
      let count = 0;

      config.on('warning', function(method, key, err) {
        if (key === 'licenses') {
          count++;
        }
      });

      config.normalize(pkg);
      assert.equal(count, 1);
      cb();
    });

    it('should convert a licenses array to a license string', () => {
      const pkg = {
        licenses: [
          { type: 'MIT', url: 'https://github.com/jonschlinkert/project-no-package/blob/master/LICENSE-MIT' }
        ]
      };

      const res = config.normalize(pkg);
      assert(!res.licenses);
      assert(res.license);
      assert.equal(typeof res.license, 'string');
      assert.equal(res.license, 'MIT');
    });

    it('should convert from an object to a string', () => {
      const pkg = {
        licenses: { type: 'MIT', url: 'https://github.com/jonschlinkert/project-no-package/blob/master/LICENSE-MIT' }
      };

      const res = config.normalize(pkg);
      assert(!res.licenses);
      assert(res.license);
      assert.equal(typeof res.license, 'string');
      assert.equal(res.license, 'MIT');
    });
  });

  describe('dependencies', () => {
    beforeEach(() => {
      config = new Normalizer({ verbose: false });
    });

    it('should remove dependencies when empty when `omitEmpty` is true', () => {
      const pkg = { dependencies: {} };
      const res = config.normalize(pkg, { omitEmpty: true });
      assert(!res.dependencies);
    });
  });

  describe('devDependencies', () => {
    beforeEach(() => {
      config = new Normalizer({ verbose: false });
    });

    it('should remove empty devDependencies when omitEmpty is true', () => {
      const pkg = { devDependencies: {} };
      const res = config.normalize(pkg, { omitEmpty: true });
      assert(!res.devDependencies);
    });
  });

  describe('engineStrict', () => {
    beforeEach(() => {
      config = new Normalizer({ verbose: false });
    });

    it('should delete engineStrict and replace it with engine-strict', () => {
      const pkg = { engineStrict: true };
      const res = config.normalize(pkg);
      assert.equal(typeof res.engineStrict, 'undefined');
      assert.equal(res['engine-strict'], true);
    });

    it('should remove engineStrict from the object', () => {
      const pkg = { engineStrict: true };
      const res = config.normalize(pkg);
      assert(!res.hasOwnProperty('engineStrict'));
    });
  });

  describe('engine-strict', () => {
    beforeEach(() => {
      config = new Normalizer({ verbose: false });
    });

    it('should warn when engine-strict value is invalid', cb => {
      const pkg = { 'engine-strict': 'foo' };
      let count = 0;

      config.on('warning', function(method, key, err) {
        if (key === 'engine-strict') {
          count++;
        }
      });

      config.normalize(pkg);
      assert.equal(count, 1);
      cb();
    });
  });

  describe('scripts', () => {
    beforeEach(() => {
      config = new Normalizer({ verbose: false });
    });

    it('should clean up mocha scripts', () => {
      const pkg = { scripts: { test: 'mocha -R spec' } };

      const res = config.normalize(pkg);
      assert(res.scripts);
      assert.equal(typeof res.scripts, 'object');
      assert.equal(res.scripts.test, 'mocha');
    });

    it('should return scripts if it is an object', () => {
      const pkg = { scripts: { test: 'foo' } };

      const res = config.normalize(pkg);
      assert(res.scripts);
      assert.equal(typeof res.scripts, 'object');
      assert.equal(res.scripts.test, 'foo');
    });
  });

  describe('keywords', () => {
    beforeEach(() => {
      config = new Normalizer({ verbose: false });
    });

    it('should use the name to create keywords when the array is empty', () => {
      const pkg = { keywords: [] };
      const res = config.normalize(pkg);
      assert.equal(res.keywords[0], 'no');
      assert.equal(res.keywords[1], 'package');
      assert.equal(res.keywords.length, 3);
    });

    it('should sort keywords', () => {
      const pkg = { keywords: ['foo', 'bar', 'baz'] };
      const res = config.normalize(pkg);
      assert.equal(res.keywords[0], 'bar');
      assert.equal(res.keywords[1], 'baz');
      assert.equal(res.keywords[2], 'foo');
    });

    it('should remove duplicates', () => {
      const pkg = { keywords: ['foo', 'foo', 'foo', 'foo', 'bar', 'baz'] };
      const res = config.normalize(pkg);
      assert.equal(res.keywords.length, 3);
    });
  });

  describe('preferGlobal', () => {
    beforeEach(() => {
      config = new Normalizer({ verbose: false });
    });

    it('should warn when preferGlobal is defined and `bin` is not defined', cb => {
      const pkg = { preferGlobal: true };
      let count = 0;

      config.on('warning', function(method, key, err) {
        if (key === 'preferGlobal') {
          count++;
        }
      });

      const res = config.normalize(pkg);
      assert(res.preferGlobal);
      assert.equal(count, 1);
      cb();
    });

    it('should not warn when preferGlobal is defined and `bin` is defined', cb => {
      const pkg = { preferGlobal: true, bin: 'main.js' };
      let count = 0;

      config.on('warning', function(method, key, err) {
        if (key === 'preferGlobal') {
          count++;
        }
      });

      const res = config.normalize(pkg);
      assert(res.preferGlobal);
      assert.equal(count, 0);
      cb();
    });

    it('should return bin as-is when it is a string', () => {
      const pkg = { bin: 'main.js' };

      const res = config.normalize(pkg);
      assert(res.bin);
      assert.equal(res.bin, 'main.js');
    });
  });

  describe('bin', () => {
    beforeEach(() => {
      config = new Normalizer({ verbose: false });
    });

    it('should not emit a warning when bin file string exists', cb => {
      const pkg = { bin: 'main.js' };
      let count = 0;

      config.on('warning', function(method, key, err) {
        if (key === 'bin') {
          count++;
        }
      });

      config.normalize(pkg);
      assert.equal(count, 0);
      cb();
    });

    it('should not emit a warning when bin file object exists', cb => {
      const pkg = { bin: { foo: 'main.js' } };
      let count = 0;

      config.on('warning', function(method, key, err) {
        if (key === 'bin') {
          count++;
        }
      });

      config.normalize(pkg);
      assert.equal(count, 0);
      cb();
    });
  });
});

