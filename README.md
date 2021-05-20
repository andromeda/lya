## Lya: Library-oriented Dynamic Analysis for Node.js Programs

Mailing lists: [Commits](lya-commits@googlegroups.com) | [Discussion](lya-discuss@googlegroups.com)

Lya is a coarse-grained dynamic analysis framework for Node.js. Use
Lya to identify and address vulnerabilities, bottlenecks, and errors.

“Coarse-grained” means that Lya limits analyses to a relatively low
level of detail to reduce overhead.


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


## API Reference

### `callWithLya`

`callWithLya := (LyaConfig) -> Any`

e.g.

```javascript
const { callWithLya } = require("@andromeda/lya");

/callWithLya(config)
```

Returns `config.onReady()`. While control is in `config.onReady()`,
Lya will auto-refactor all files loaded as modules.


The `config` object supports the following keys.

* `onReady`: A function suitable for use as an [`onReady`][] hook.


## Hook Reference

### `onReady`

`onReady := () -> Any`

Called exactly once for every application of [`callWithLya`][] to
define an entry point for analysis.
