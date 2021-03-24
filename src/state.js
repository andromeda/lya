// Create mutable objects for holding analysis state.
// We keep this in a separate module to avoid circular
// dependencies involving core.js.

module.exports = {
  createLyaState,
};

const {configureLya} = require('./config.js');
const {createReferenceMetadataStore} = require('./metadata.js');

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
