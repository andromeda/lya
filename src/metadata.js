module.exports = {
  createReferenceMetadataStore,
};

const {assert, assertDeepEqual, test} = require('./test.js');

function createReferenceMetadataStore() {
  const M = new WeakMap();

  const get = (obj) => {
    if (!M.has(obj)) {
      M.set(obj, { type: typeof obj });
    }

    return M.get(obj);
  }

  const set = (obj, data) => {
    Object.assign(get(obj), data);
  }

  return {
    get,
    set,
  };  
}


function getOPath(get, ref) {
  const { parent, name } = get(ref);
  const displayName = name || '';
  
  if (parent) {
    return getOPath(get, parent) + '.' + displayName;
  } else {
    return displayName;
  }
}



test(() => {
  const { get, set } = createReferenceMetadataStore();

  const [A, B, C] = [{}, [], {}];

  assert(get(A) === get(A),
         'Allow by-reference identity');

  set(A, { x: get(B), y: get(C) })
  
  assert(get(A).x === get(B) && get(A).y === get(C),
         'Store data using own enumerable properties.');

  set(A, { name: 'a', parent: B });
  set(B, { name: 'b', parent: C });
  set(C, { name: 'c', parent: null });

  assert(getOPath(get, A) === 'c.b.a' &&
         getOPath(get, B) === 'c.b' &&
         getOPath(get, C) === 'c',
         'Trace object paths through metadata');
});
