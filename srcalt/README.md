This implementation improves on the last in the following ways:

* Allows state mutation for performance, but a functional front-end
  for predictability. This way, Lya runs purely in terms of arguments
  without sacrificing the speed gains from using mutable state. This
  allows an analysis to run Lya recursively, and adjust its results in
  more nuanced ways.

* Moves responsibility for creating mutable state (`env`) to the user.
  This is key for accumulating results from recursive use of Lya, and
  avoids some issues with `require(something)(env)`.

* Moves tests close to their subjects. See `test.js` for a list of
  benefits to this approach.

* Names utility libraries after the datatype on which they operate. So
  instead of `utils.js`, you have `functions.js`, `arrays.js`,
  etc. This avoids the "junk drawer" feel and organizes JS outside of
  the core logic.

* Leverage hoisting of top-level function declarations to show
  `module.exports` first, followed by declarations sorted from
  high-level to low-level. This increases legibility by showing what
  the module does for you immediately.

* Otherwise improve modularity and readability.

The rest of the [other README](../src/README.md) still applies, save
for file names.
