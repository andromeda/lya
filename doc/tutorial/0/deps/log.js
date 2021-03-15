module.exports = (
    Object.entries(lib.levels).reduce(([name, level], lib) =>
        Object.assign(lib, {
            [name]: (...a) => (lib.lvl <= level && console.log(...a)),
        }),
    {
        // by default, output everything
        lvl: 1,
        levels: {
            err: 3,
            warn: 2,
            info: 1, 
        }
    });
);

