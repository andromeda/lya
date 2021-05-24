## Lya: Library-oriented Dynamic Analysis for Node.js Programs

Mailing lists: [Commits](lya-commits@googlegroups.com) | [Discussion](lya-discuss@googlegroups.com)

Lya is an analysis framework for Node.js. Use Lya to identify and
address vulnerabilities, bottlenecks, and errors. Unlike alternatives,
Lya uses a combination of static _and_ dynamic information to draw
more meaningful conclusions about data.


## How to Use Lya

You can use Lya programmatically, or from a command-line utility.  The
methods are kept similar to make Lya easy to extend.


### Programmatic Use

To use Lya programmatically, call [`callWithLya`][] with your
configuration. The minimal program uses the [`onReady`][] hook.

```JavaScript
const { callWithLya } = require("@andromeda/lya");

callWithLya({
    onReady: () => require("./analyze-me.js"),
});
```

So as long as control remains in [`onReady`][], all calls to _any_
`require` function will dynamically-rewrite code before running it in
the current V8 Context. The rewritten code calls your hooks in advance
of the program's actual behavior. This means you should only create
hooks using __trusted code__.


### Command-Line Use

You can use the provided `lya` executable to designate a CommonJS
module to provide an argument to `callWithLya`.

For example, you can define a CommonJS module named `example.js`.  The
module must export a function that, when called, returns an object to
use with `callWithLya`. The argument `argv` is an array of _remaining_
arguments on the command line (that is, the part of `process.argv`
left over after removing the arguments that led to calling
`configureLya`).

```javascript
module.exports = function configureLya(argv) {
  return {
    onReady: () => require("./analyze-me.js"),
  };
}
```

You can then pass the module to Lya as a trusted file. Note that the
`require` function is unique to `example.js`, but we assume
`analyze-me.js` is still in the same directory.

```console
$ lya example.js
```

The command will print the value returned from `callFromLya` to STDOUT
using `console.log`, meaning that if you don't want
inspection-friendly output, you may need to pass your output to
`JSON.stringify` first.


## API Reference

### `callWithLya`
[`callWithLya`]: #callwithlya

`callWithLya := (LyaConfig) -> Any`

e.g.

```javascript
const { callWithLya } = require("@andromeda/lya");

callWithLya(config)
```

Returns `config.onReady()`. While control is in `config.onReady()`,
Lya will auto-refactor all files loaded as modules.


The `config` object supports the following keys.

* `onReady`: A function suitable for use as an [`onReady`][] hook.


## Alphabetized Hook Reference

### `afterAnalysis`
[`afterAnalysis`]: #afteranalysis

`afterAnalysis := Any -> Any`

Called exactly once after [`onReady`][] to perform postprocessing on
[`onReady`][]'s return value, but immediately before control leaves
[`callWithLya`][]. This hook determines the return value of
[`callWithLya`][].

The sole argument is the value returned from [`onReady`][].

The default implementation is the identity function.


### `onError`
[`onError`]: #onerror

`onError := Error -> Any`

Called exactly once when [`callWithLya`][] catches a thrown
value. This hook determines the return value of [`callWithLya`][] if
it does not re-throw its argument.

The sole argument is the value caught by [`callWithLya`][].

The default implementation simply throws its argument.


### `onReady`
[`onReady`]: #onready

`onReady := () -> Any`

Called exactly once for every application of [`callWithLya`][] to
define an entry point for analysis. If `onReady` throws no error,
[`callWithLya`][] forwards its return value to [`afterAnalysis`][].
