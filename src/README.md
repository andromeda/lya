This implementation improves on the last in the following ways:

* Allows one to run Lya recursively, and adjust its results in
  more nuanced ways.

    * Overrides `vm.runInThisContext` to run in terms of
      `vm.runInContext`.  This makes it easier to manage Lya's
      destructive changes to the global object, such that you can
      remove the need to require Lya in advance of other code. It's
      also one aspect of allowing nested analyses.

    * Allows state mutation for performance, but a functional front-end
      for predictability. This way, Lya runs purely in terms of arguments
      without sacrificing the speed gains from using mutable state.

    * Moves responsibility for creating mutable state (`env`) to the user.
      This is key for accumulating results from recursive use of Lya.

* Moves tests close to their subjects. See `test.js` for a list of
  benefits to this approach.

* Names utility libraries after the datatype on which they
  operate, or after the topic it covers.

* Stylistic change: Leverage hoisting of top-level function
  declarations to show `module.exports` first, followed by
  declarations sorted from high-level to low-level. This increases
  legibility by showing what the module does for you immediately.

* Otherwise improve modularity and readability.

The rest of the [other README](../src/README.md) still applies, save
for file names.
