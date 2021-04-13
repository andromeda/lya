module.exports = {
  createReferenceMetadataStore,
};

const {assert, test} = require('./test.js');

function createReferenceMetadataStore() {
  const M = new WeakMap();
  return (obj, cb) => {
    // .set will fail if the key is incompatible.
    try {
      M.set(obj, M.get(obj) || {})
    } catch (e) {
      return cb(e, {}, obj);
    }

    return cb(null, M.get(obj), obj);
  };
}


test(() => {
  const open = createReferenceMetadataStore();

  const A = {};
  const B = 1;

  function incompatible(e, meta, nonkey) {
    assert(e instanceof Error, 'Pass Error to incompatible()');
    assert(nonkey === B, 'Pass non-key to callback');
    return nonkey;
  }
  
  open(A, (e, m, k) => {
    assert(e === null, 'Throw no error');
    assert(k === A, 'Pass key to callback');
    m.foo = B;
  });
  
  assert(open(A, (e, {foo}) => foo) === B,
         'Access data via mutation.');

  assert(open(B, incompatible) === B,
         'Respond to incompatible keys');
});
