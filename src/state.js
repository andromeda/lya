// Create mutable objects for holding analysis state.
// We keep this in a separate module to avoid circular
// dependencies involving core.js.

module.exports = {
  createLyaState,
  inferName,
  registerModule,
  setCurrentModule,
  getDeclaringModule,
  getOPath,
  registerReference,
  getReferenceDepth,
  getModuleRelativeOPath,
  inScopeOfAnalysis,
};

const {configureLya} = require('./config.js');
const {failAs} = require('./control.js');
const {createReferenceMetadataStore} = require('./metadata.js');
const {elementOf} = require('./container-type.js');
const {test, assert} = require('./test.js');
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

    // For counting proxied object types.
    counters: { total: 0 },

    // For collecting user-defined data.
    results: {},
  };
}

function inScopeOfAnalysis({include, exclude}, element) {
  return elementOf(include, element) || !elementOf(exclude, element);
}

function inferName(env, variant) {
  const type = typeof variant;

  const { name } = env.metadata.get(variant, () => ({
    name: failAs(false, () => variant.toString())
  }));

  if (name) {
    return name;
  } else if (variant instanceof Module) {
    return Module._resolveFilename(variant.filename);
  } else if (type === 'function') {
    // Use .toString() because the function name may be a Symbol(),
    // which can lead to TypeErrors on implicit string coercion.
    return variant.name.toString();
  }
}


function registerReference(env, variant) {
  env.metadata.set(variant, {
    name: inferName(env, variant),
    parent: (
      env.metadata.get(variant, () => ({ parent: false })).parent ||
        env.currentModule ||
        env.context ||
        global
    ),
  });
}


function registerModule(env, module) {
  registerReference(env, module);
  env.metadata.set(module, {
    parent: env.context || global,
  });

  const { name } = env.metadata.get(module);
  env.results[name] = env.results[name] || {};
}


function setCurrentModule(env, module) {
  env.currentModule = module;
  registerModule(env, module);
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

function getModuleRelativeOPath(env, ref) {
  if (!ref) {
    return '';
  } else {
    const { parent, name } = env.metadata.get(ref);
    const displayName = name || '';

    if (ref instanceof Module) {
      return displayName;
    } else {
      return getModuleRelativeOPath(env, parent) + '.' + displayName.toString();
    }
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


function getReferenceDepth(env, ref) {
  if (!ref) {
    return 0;
  } else {
    const { parent } = env.metadata.get(ref);
    return 1 + getReferenceDepth(env, parent);
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
