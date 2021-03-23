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


module.exports = Object.freeze({
    IDENTIFIER_CLASSIFICATIONS,
    NATIVE_MODULES,
    NEGLIGIBLE_EXPORT_TYPES,
    COMMONJS_MODULE_IDENTIFIERS,
});
