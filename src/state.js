// Create mutable objects for holding analysis state.
// We keep this in a separate module to avoid circular
// dependencies involving core.js.

module.exports = {
  createLyaState,
  registerModule,
  setCurrentModule,
  getDeclaringModule,
  getOPath,
};

const {configureLya} = require('./config.js');
const {createReferenceMetadataStore} = require('./metadata.js');
const {test, assert, assertDeepEqual} = require('./test.js');
const Module = require('module');

// Creates an object used to collect facts from the runtime.
function createLyaState(...configs) {
  return {
    // Contains hooks, policy info, and other user-specific goodies.
    config: configureLya(...configs),

    // Contains metadata collected for references as they are found.
    metadata: createReferenceMetadataStore(),

    // Track dependency relationships
    currentModuleRequest: null,
    currentModule: null,

    // For collecting user-defined data.
    results: {},
  };
}


function registerModule(env, module) {
  env.metadata.set(module, {
    name: module.filename,
    parent: env.context || global,
  });
}


function setCurrentModule(env, module) {
  registerModule(env, module);
  env.currentModule = module;
}


function getOPath(env, ref) {
  const { parent, name } = env.metadata.get(ref);
  const displayName = name || '';

  if (parent) {
    return getOPath(env, parent) + '.' + displayName;
  } else {
    return displayName;
  }
}


function getDeclaringModule(env, ref) {
  if (!ref) {
    return;
  } else if (ref instanceof Module) {
    return ref;
  } else {
    return getDeclaringModule(env, env.metadata.get(ref).parent);
  }
}


test(() => {
  const env = createLyaState();
  const { metadata: { set } } = env;
  const [A, B, C] = [{}, [], {}];

  set(A, { name: 'a', parent: B });
  set(B, { name: 'b', parent: C });
  set(C, { name: 'c', parent: null });

  assert(getOPath(env, A) === 'c.b.a' &&
         getOPath(env, B) === 'c.b' &&
         getOPath(env, C) === 'c',
         'Trace object paths through metadata');
});
