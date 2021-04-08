// Create mutable objects for holding analysis state.
// We keep this in a separate module to avoid circular
// dependencies involving core.js.

module.exports = {
  createLyaState,
  inferName,
  registerModule,
  setCurrentModule,
  getDotPath,
  registerReference,
  getReferenceDepth,
  inScopeOfAnalysis,
};

const {configureLya} = require('./config.js');
const {failAs} = require('./control.js');
const {createReferenceMetadataStore} = require('./metadata.js');
const {elementOf} = require('./container-type.js');
const {test, assert} = require('./test.js');
const path = require('path');
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

function getModuleName(module) {
  return Module._resolveFilename(module.filename);
}

function inferName(env, variant) {
  const type = typeof variant;

  const { name } = env.metadata.get(variant, () => ({
    name: failAs(false, () => variant.toString())
  }));

  if (name) {
    return name;
  } else if (variant instanceof Module) {
    return getModuleName(variant);
  } else if (type === 'function') {
    // Use .toString() because the function name may be a Symbol(),
    // which can lead to TypeErrors on implicit string coercion.
    return variant.name.toString();
  } else if (type === 'object' && variant !== null) {
    for (const k of Object.getOwnPropertyNames(global)) {
      if (global[k] === variant) {
        return k;
      }
    }
  }
}


function registerReference(env, variant) {
  env.metadata.set(variant, {
    name: inferName(env, variant),
    initialOccurringModule: env.metadata.get(variant, () => ({ initialOccurringModule: false })).initialOccurringModule || env.currentModule,
  });
}


function registerModule(env, module) {
  const name = getModuleName(module);

  env.metadata.set(module, {
    name,
    exportName: `require('${name}')`,
    parent: null,
  });

  env.results[name] = env.results[name] || {};
}


function setCurrentModule(env, module) {
  env.currentModule = module;
  registerModule(env, module);
}


function getDotPath(env, ref) {
  const { parent, name } = env.metadata.get(ref);

  const useableName = name ? name.toString() : '';

  const displayName = (
    path.isAbsolute(useableName)
      ? `require('${useableName}')`
      : useableName
  );

  if (parent) {
    return getDotPath(env, parent) + '.' + displayName;
  } else {
    return displayName;
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

  assert(getDotPath(env, A) === 'c.b.a' &&
         getDotPath(env, B) === 'c.b' &&
         getDotPath(env, C) === 'c',
         'Trace object paths through metadata');
});
