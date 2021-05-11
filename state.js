// Create mutable objects for holding analysis state.
// We keep this in a separate module to avoid circular
// dependencies involving core.js.

module.exports = {
  createLyaState,
  inferReferenceName,
  pushModule,
  popModule,
  peekModule,
  findDeclaringModule,
  getReferenceDepth,
};

const Module = require('module');

// Creates an object used to collect facts from the runtime.
function createLyaState() {
  return {
    hook: () => {},

    // Manages metadata for references
    open: createMetadataStore(),

    // Helps track dynamic extent for modules
    moduleExtent: [],
  };
}

function createMetadataStore() {
  const M = new WeakMap();
  return function openMetadata(obj) {
    // .set will fail if the key is incompatible.
    try {
      M.set(obj, M.get(obj) || {})
    } catch (e) {
      return [e, {}];
    }

    return [null, M.get(obj)];
  };
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
        return k;
      }
    }
  } else if (variant) {
    return variant.toString();
  } else {
    return '';
  }
}


function findDeclaringModule(env, val, meta) {
  if (!val || val instanceof Module) {
    meta.initialOccurringModule = val || peekModule(env);
  } else {
    const [,{parent}] = env.open(val);
    return findDeclaringModule(env, parent, meta);
  }
}

function pushModule(env, module) {
  if (module && module !== peekModule(env)) {
    env.moduleExtent.push(module);
  }
}

function peekModule(env) {
  return env.moduleExtent[env.moduleExtent.length - 1];
}

function popModule(env) {
  return env.moduleExtent.pop();
}

function getReferenceDepth(env, ref) {
  const [error, { parent }] = env.open(ref);
  if (error) return 0;
  if (ref === parent) return Infinity;
  return 1 + getReferenceDepth(env, parent);
}
