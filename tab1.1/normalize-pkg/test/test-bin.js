'use strict';

require('mocha');
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const del = require('delete');
const createRepo = require('./support/git');
const Normalizer = require('..');
let config;

const origCwd = process.cwd();
const project = path.resolve(__dirname, 'fixtures/project-bin');
const remote = `https://github.com/jonschlinkert/${path.basename(project)}.git`;
const gitPath = path.resolve(project, '.git');

describe('normalize (bin)', () => {
  beforeEach(() => {
    config = new Normalizer({ verbose: false });
  });

  before(cb => {
    process.chdir(project);
    createRepo(project, remote, cb);
  });

  after(cb => {
    process.chdir(origCwd);
    del(gitPath, cb);
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

      assert.equal(res.files.indexOf('bin'), 0);
      assert.equal(res.files.indexOf('cli.js'), 1);
      assert.equal(res.files.indexOf('main.js'), 2);
    });

    it('should not add `main` file to files array when file does not exist', () => {
      const pkg = {
        files: [],
        main: 'index.js'
      };

      const res = config.normalize(pkg);
      assert(res.hasOwnProperty('files'));
      assert(res.files.indexOf('index.js') === -1);
    });

    it('should create files array with main', () => {
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
      assert.equal(res.files.length, 3);
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

  describe('preferGlobal', () => {
    beforeEach(() => {
      config = new Normalizer({ verbose: false });
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

    it('should add `bin/foo.js` to bin', () => {
      const res = config.normalize({});
      assert.equal(res.bin[res.name], 'bin/foo.js');
    });

    it('should add `cli.js` to bin', cb => {
      del('bin/foo.js', function(err) {
        if (err) return cb(err);
        const res = config.normalize({});
        assert.equal(res.bin[res.name], 'cli.js');
        fs.writeFile('bin/foo.js', '#!/usr/bin/env node\n\n', cb);
      });
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
