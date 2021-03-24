module.exports = {
  createReferenceMetadataStore,
  getDeclaringModule,
  getOPath,
  setName,
  setParent,
};

const {assert, assertDeepEqual, test} = require('./test.js');
const Module = require('module');

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

function setParent(metadata, child, parent) {
  metadata.set(child, { parent });
}

function setName(metadata, object, name) {
  metadata.set(object, { name });
}

function getOPath(metadata, ref) {
  const { parent, name } = metadata.get(ref);
  const displayName = name || '';
  
  if (parent) {
    return getOPath(metadata, parent) + '.' + displayName;
  } else {
    return displayName;
  }
}

function getDeclaringModule(metadata, ref) {
  if (!ref) {
    return;
  } else if (ref instanceof Module) {
    return ref;
  } else {
    return getDeclaringModule(metadata, metadata.get(ref).parent);
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
