const fs = require('fs');
const path = require('path');

const {noop, identity} = require('./functions.js');
const {assert, test} = require('./test.js');
const {merge} = require('./container-type.js');


module.exports = {
  preset: findPresets(path.join(__dirname, 'analysis')),

  inTermsOf,

  makePresetName,

  configureLya: inTermsOf({
    inputString: false,
    printCode: false,
    vmConfig: {
    },
    vmContextConfig: {
      codeGeneration: {
        strings: true,
        wasm: true,
      },
    },
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
      exclude: [],
    },
    hooks: {
      onCallPre: noop,
      onCallPost: noop,
      onHas: noop,
      onExit: noop,
      onRead: noop,
      onImport: noop,
      onWrite: noop,
      sourceTransform: identity,
    },
    modules: {
      include: [],
      exclude: [],
    },
    fields: {
      include: [],
      exclude: [],
    },
  }),
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

test(() => {
  assert(makePresetName('/a/b/c/my-file-tis__of-th3e') === 'MY_FILE_TIS_OF_TH3E',
      'Compute user-facing present names');
});


// This forces defaults to be specified in advance
// such that no existence checks are needed later.
function inTermsOf(defaults) {
  return (...overrides) =>
    overrides.reduce((reduction, override) =>
                     merge(reduction, override || {}),
                     defaults);
}

test(({equal}) => {
  const defaults = {
    a: {
      b: {
        c: 3,
      },
      x: [1, 2, 3],
    },
  };

  const overrides = {
    a: {
      b: {
        c: {d: 4},
        e: 5,
      },
      x: [4, 5, 6],
    },
    f: 6,
  };

  const expected = {
    a: {
      b: {
        c: {d: 4},
        e: 5,
      },
      x: [1, 2, 3, 4, 5, 6],
    },
    f: 6,
  };


  assert(equal(inTermsOf(defaults)(overrides), expected),
      'Deeply merge options onto prescribed defaults');
});
