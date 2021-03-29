module.exports = {
  createReferenceMetadataStore,
};

const {assert, test} = require('./test.js');
const {raise} = require('./control.js');

function createReferenceMetadataStore() {
  const M = new WeakMap();

  const get = (obj, fail = raise) => {
    try {
      if (!M.has(obj)) {
        M.set(obj, { type: typeof obj });
      }

      return M.get(obj);
    } catch (e) {
      return fail(e);
    }
  }

  const set = (obj, data) => {
    Object.assign(get(obj), data);
  }

  return {
    get,
    set,
  };
}


test(() => {
  const metadata = createReferenceMetadataStore();
  const { get, set } = metadata;

  const [A, B, C] = [{}, [], {}];

  assert(get(A) === get(A),
         'Allow by-reference identity');

  set(A, { x: get(B), y: get(C) })

  assert(get(A).x === get(B) && get(A).y === get(C),
         'Store data using own enumerable properties.');
});
