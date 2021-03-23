const IDENTIFIER_CLASSIFICATIONS = {
    // e.g. global.x, x
    USER_GLOBALS: 'user-globals',

    // e.g. console, setImmediate
    // TODO: Rename to builtin-globals?
    NODE_GLOBALS: 'node-globals',

    // e.g. exports, require, module, __filename, __dirname
    MODULE_LOCALS: 'module-locals',

    // e.g. exports, module.exports
    MODULE_RETURNS: 'module-returns',
};

const NATIVE_MODULES = Object.keys(process.binding('natives'));

const NEGLIGIBLE_EXPORT_TYPES = [
    'boolean',
    'symbol',
    'number',
    'string',
];

const COMMONJS_MODULE_IDENTIFIERS = [
    'exports',
    'require',
    'module',
    '__filename',
    '__dirname',
];


const INJECTED_GLOBAL_IDENTIFIER = 'localGlobal';
const INJECTED_WITH_GLOBAL_IDENTIFIER = 'withGlobal';

// We need a CommonJS superset
const EXTENDED_COMMONJS_MODULE_IDENTIFIERS =
      COMMONJS_MODULE_IDENTIFIERS.concat([
          INJECTED_GLOBAL_IDENTIFIER,
          INJECTED_WITH_GLOBAL_IDENTIFIER,
      ]);


module.exports = Object.freeze({
    IDENTIFIER_CLASSIFICATIONS,
    NATIVE_MODULES,
    NEGLIGIBLE_EXPORT_TYPES,
    COMMONJS_MODULE_IDENTIFIERS,
    INJECTED_GLOBAL_IDENTIFIER,
    INJECTED_WITH_GLOBAL_IDENTIFIER,
    EXTENDED_COMMONJS_MODULE_IDENTIFIERS,
});
