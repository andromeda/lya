'use strict';

require('mocha');
var assert = require('assert');
var deepBind = require('./');

describe('deepBind', function() {
  it('should bind a context to fns passed on an object:', function() {
    var ctx = {
      app: {views: {}},
      context: {a: 'b'}
    };

    var helpers = deepBind({
      foo: function() {
        return this.context;
      },
      bar: function() {},
      baz: function() {}
    }, ctx);

    assert.deepEqual(helpers.foo(), {a: 'b'});
  });

  it('should bind a context to deeply nested functions', function() {
    var ctx = {
      app: {
        views: {}
      },
      context: {
        a: 'b'
      }
    };
    var helpers = deepBind({
      abc: {
        foo: function() {
          return this.context;
        },
        bar: function() {},
        baz: function() {},
        qux: {
          fez: function() {
            return this.context;
          }
        }
      }
    }, ctx);

    assert.deepEqual(helpers.abc.qux.fez(), {a: 'b'});
  });

  it('should bind a context to fns passed on an object of objects:', function() {
    var ctx = {
      app: {
        views: {}
      },
      context: {
        a: 'b'
      }
    };
    var obj = {
      abc: {
        foo: function() {
          return this.context;
        },
        bar: function() {},
        baz: function() {}
      }
    };
    obj.abc.foo.async = true;
    var helpers = deepBind(obj, ctx);
    assert(helpers.abc.foo.async === true);
  });

  it('should expose original context as _parent on bound context', function() {
    var ctx = {
      context: { c: 'd' }
    };

    var obj = {
      context: { a: 'b' },
      foo: function() {
        return this._parent.context;
      },
      bar: function() {
        return this.context;
      }
    };

    var helpers = deepBind(obj, ctx, {
      bindFn: function(thisArg, key, parent, options) {
        thisArg._parent = parent;
        return thisArg;
      }
    });

    assert.deepEqual(helpers.foo(), { a: 'b' })
    assert.deepEqual(helpers.bar(), { c: 'd' })
  });

  it('should expose property-specific options to a function', function() {
    var ctx = {
      app: {
        views: {}
      },
      context: {
        a: 'b'
      }
    };
    var opts = {
      foo: {a: 'b'},
      bar: {b: 'c'}
    };
    var obj = {
      foo: function() {
        return this.options;
      },
      bar: function() {},
      baz: function() {}
    };
    var helpers = deepBind(obj, ctx, opts);
    assert.equal(helpers.foo().a, 'b');
  });

  it('should merge property-specific options with context options', function() {
    var ctx = {
      app: {
        views: {}
      },
      options: {
        x: 'z'
      },
      context: {
        a: 'b'
      }
    };
    var opts = {
      foo: {a: 'b'},
      bar: {b: 'c'}
    };
    var obj = {
      foo: function() {
        return this.options;
      },
      bar: function() {},
      baz: function() {}
    };
    var helpers = deepBind(obj, ctx, opts);
    assert.equal(helpers.foo().a, 'b');
    assert.equal(helpers.foo().x, 'z');
  });

  it('should merge property-specific options OVER context options', function() {
    var ctx = {
      app: {
        views: {}
      },
      options: {
        a: 'z'
      },
      context: {
        a: 'b'
      }
    };
    var opts = {
      foo: {a: 'b'},
      bar: {b: 'c'}
    };
    var obj = {
      foo: function() {
        return this.options;
      },
      bar: function() {},
      baz: function() {}
    };
    var helpers = deepBind(obj, ctx, opts);
    assert.equal(helpers.foo().a, 'b');
  });

  it('should also expose options on options[helperName]', function() {
    var ctx = {
      app: {
        views: {}
      },
      options: {
        a: 'z'
      },
      context: {
        a: 'b'
      }
    };
    var opts = {
      foo: {a: 'b'},
      bar: {b: 'c'}
    };
    var obj = {
      foo: function() {
        return this.options;
      },
      bar: function() {},
      baz: function() {}
    };
    var helpers = deepBind(obj, ctx, opts);
    assert.equal(helpers.foo().foo.a, 'b');
  });

  it('should set non-object options on `options[helperName]`', function() {
    var ctx = {
      app: {
        views: {}
      },
      options: {
        a: 'z'
      },
      context: {
        a: 'b'
      }
    };
    var opts = {
      foo: true,
      bar: {b: 'c'}
    };
    var obj = {
      foo: function() {
        return this.options;
      },
      bar: function() {},
      baz: function() {}
    };
    var helpers = deepBind(obj, ctx, opts);
    assert.equal(helpers.foo().foo, true);
  });

  it('should throw an error when invalid args are passed', function(cb) {
    try {
      deepBind();
      cb(new Error('expected an error'));
    } catch (err) {
      assert(err);
      assert.equal(err.message, 'expected an object');
      cb();
    }
  });
});
