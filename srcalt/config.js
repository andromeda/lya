const fs   = require('fs');
const path = require('path');

const { noop, identity } = require('./functions.js');
const { assert, test } = require('./test.js');


module.exports = {
    preset: findPresets(path.join(__dirname, 'analysis')),

    configureVmContext: inTermsOf({}),

    configureHooks: inTermsOf({
        onCallPre: noop,
        onCallPost: noop,
        onHas: noop,
        onExit: noop,
        onRead: noop,
        onImport: noop,
        onWrite: noop,
        sourceTransform: identity,
    }),

    configureVm: inTermsOf({
        // Allow eval and wasm
        codeGeneration: {
            strings: true,
            wasm: true,
        },
    }),
    
    defaults: {
        inputString: false,
        printCode: false,
        depth: 3,
        enableWith: false,
        context: {
            include: [
                'user-globals',
                'es-globals',
                'node-globals',
                'module-locals',
                'module-returns',
            ],
            excludes: [],
        },
        modules: {
            include: null,
            excludes: null,
        },
        fields: {
            include: false,
            excludes: [],
        },
    },    
};



// Assumption: The directory used in this function contains trusted code.
function findPresets(presetDirectory, output = {}) {
    return fs.readdirSync(presetDirectory)
      .map((fn) => path.join(presetDirectory, fn))
      .reduce((reduction, completePath) => {
          // Try not to use the ternary operator. It makes for
          // satisfying code golf, but the resulting expression is too
          // dense for others to comfortably read.
          if (fs.lstatSync(completePath).isDirectory()) {
              return findPresets(completePath, reduction);
          } else {
              return Object.assign(reduction, {
                  [makePresetName(completePath)]: completePath,
              });
          }
      }, output);
}

function makePresetName(completePath) {
    return path
        .basename(completePath, path.extname(completePath))
        .replace(/_/g, ' ') // Helps replace contiguous underscores
        .replace(/\W+/g, '_')
        .toUpperCase();
}

test(module, () => {
    assert(makePresetName('/a/b/c/my-file-tis__of-th3e') === 'MY_FILE_TIS_OF_TH3E',
           'Compute user-facing present names');
});


// This forces defaults to be specified in advance
// such that no existence checks are needed later.
function inTermsOf(defaults) {
    return (overrides) => Object.assign(defaults, overrides || {});
}

test(module, ({ equal }) => {
    assert(equal(inTermsOf({ a: 1, b: 2, c: 3 })({ d: 4, c: 1 }), { a: 1, b: 2, c: 1, d: 4 }),
           'Merge options onto prescribed defaults');
});
