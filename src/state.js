// Create mutable objects for holding analysis state.
// We keep this in a separate module to avoid circular
// dependencies involving core.js.


module.exports = {
  createLyaState,
  inferReferenceName,
  setCurrentModule,
  getDotPath,
  getReferenceDepth,
  inScopeOfAnalysis,
  buildAbbreviatedDotPath,
};

const {configureLya} = require('./config.js');
const {createReferenceMetadataStore} = require('./metadata.js');
const {elementOf} = require('./container-type.js');
const {test, assert} = require('./test.js');
const Module = require('module');

// Creates an object used to collect facts from the runtime.
function createLyaState(...configs) {
  return {
    // Contains hooks, policy info, etc.
    config: configureLya(...configs),

    // Manages metadata for references
    open: createReferenceMetadataStore(),

    // Helps track dependency relationships
    currentModule: null,

    // User-defined
    results: {},
  };
}

function inScopeOfAnalysis({include, exclude}, element) {
  return include.length > 0
    ? elementOf(include, element)
    : !elementOf(exclude, element);
}

function inferReferenceName(variant) {
  const type = typeof variant;

  if (variant instanceof Module) {
    return 'module';
  } else if (type === 'function') {
    // Use .toString() because the function name may be a Symbol(),
    // which can lead to TypeErrors on implicit string coercion.
    return variant.name.toString();
  } else if (type === 'object' && variant !== null) {
    for (const k of Object.getOwnPropertyNames(global)) {
      if (global[k] === variant) {
        return k === 'globalThis'
          ? 'global'
          : k;
      }
    }
  } else if (variant) {
    return variant.toString();
  } else {
    return '';
  }
}


function setCurrentModule(env, module) {
  env.currentModule = module;

  if (module) {
    const name = Module._resolveFilename(module.filename);
    env.results[name] = env.results[name] || {};
  }
}


function getDotPath(env, ref) {
  return env.open(ref, (error, { parent, name, isGlobal }) => {
    if (error) throw error;

    return (parent && parent !== global && parent !== ref && !isGlobal && !(parent instanceof Module))
      ? getDotPath(env, parent) + '.' + name
      : name;
  });
}

function buildAbbreviatedDotPath(env, ref, prop) {
  const suffix = prop ? '.' + prop.toString() : '';

  return (getDotPath(env, ref) + suffix).replace(/^global\./, '');
}


function getReferenceDepth(env, ref) {
  return env.open(ref, (error, meta) => {
    if (error) return 0;
    if (ref === meta.parent) return Infinity;
    return 1 + getReferenceDepth(env, meta.parent);
  })
}

test(() => {
  const env = createLyaState();
  const { open } = env;
  const [A, B, C] = [{}, [], {}];

  const assign = data => (e, meta) => Object.assign(meta, data);

  open(A, assign({ name: 'a', parent: B }))
  open(B, assign({ name: 'b', parent: C }))
  open(C, assign({ name: 'c', parent: null }))

  assert(getDotPath(env, A) === 'c.b.a' &&
         getDotPath(env, B) === 'c.b' &&
         getDotPath(env, C) === 'c',
         'Trace object paths through metadata');
});
