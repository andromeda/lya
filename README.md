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

`callWithLya := (config : CallWithLyaInput) -> Any`

e.g.

```javascript
const { callWithLya } = require("@andromeda/lya");

callWithLya(config)
```

Returns `config.onReady()`. While control is in `config.onReady()`,
Lya will auto-refactor all files loaded as modules.

See [`CallWithLyaInput`][] for the supported keys.


## Hook Reference

### `afterAnalysis`
[`afterAnalysis`]: #afteranalysis

`afterAnalysis := Any -> Any`

Called exactly once after [`onReady`][] to perform postprocessing on
[`onReady`][]'s return value, but immediately before control leaves
[`callWithLya`][]. This hook determines the return value of
[`callWithLya`][].

The sole argument is the value returned from [`onReady`][].

The default implementation is the identity function.


### `afterRewriteModule`
[`afterRewriteModule`]: #aftermodulerewrite

`afterRewriteModule := (rwi : RewriteModuleInput) -> String`

Called after Lya rewrites the source code of a module using the given
[`RewriteModuleInput`][].

Returns the source code to actually execute as a new module in
Node.js. The `script` property of the input argument is the source
code of the module after Lya's instrumentation has been applied.

The default implementation only returns the `script` property of the
input argument.


### `onError`
[`onError`]: #onerror

`onError := (err : Any) -> Any`

Called exactly once when [`callWithLya`][] catches a thrown
value. `err` is normally an `Error`, but the sole argument is any
value caught by [`callWithLya`][].

This hook determines the return value of [`callWithLya`][] if it does
not re-throw its argument.

The default implementation simply throws its argument.


### `onReady`
[`onReady`]: #onready

`onReady := () -> Any`

Called exactly once for every application of [`callWithLya`][] to
define an entry point for analysis. If `onReady` throws no error,
[`callWithLya`][] forwards its return value to [`afterAnalysis`][].


### `onApply`
[`onApply`]: #onapply

```
onApply := (original : Function, context : Object) -> Any
```

A hook that fires before a function call in the subject.

Returns a value for use where the call was hooked.

Arguments:

* `original`: A thunk constructed by Lya, wrapping the call to the
  given function, as it originally appeared in the source
  code. Therefore, `return original()` will execute the original
  function and return the value the author intended.

* `context`: An object clarifying the nature of the call.
  * `instrumentation`: The [`Instrumentation`] object for the module _lexically_ containing the function call.
  * `node`: The [`CallExpression`][] ESTree node describing the call as it appears in source code.
  * `target`: A reference to the function being called.
  * `args`: An array of arguments that would be passed to `target` if `original()` were called.


```javascript
function onApply(continue) {
    try {
        // Do stuff before letting code run.
        const result = continue();
        // Do stuff after letting code run.
        return result;
    } catch (e) {
        // Maybe handle errors the original implementation didn't.
    }
}
```

```javascript
// Affects ALL functions, so this will likely break everything.
function onApply() {
    return 'something completely different';
}
```


### `onHook`
[`onHook`]: #onhook

```
onHook := (original: Function, options: Object) -> Any
```

Called each time Lya is about to replace input code with an
instrumented functional equivalent. The injected code is expected to
call a user's hook.

`original` is a thunk that, when called, returns a string. The string
contains instrumented source code as Lya would inject it into a
subject. `options` holds information used to compute Lya's code.

`options.instrumentationId`: A string form of the module-specific
identifier used to access the instrumentation object in the subject.

`options.instrumentation`: The [`Instrumentation`][] object bound to
`options.instrumentationId` in the subject.

`options.node`: The [`ESTree`][] object in the subject reflecting
source code that will be replaced.

`options.hookName`: The string name of a hook, suitable for use as an
object key (e.g. `'onApply'`).

`options.isExpression`: A boolean indicating whether `options.node` is
an ECMAScript expression, as opposed to a statement or special
operator.

`options.injectProperties`: An object expressing generated source code
used to compute some hook arguments. When the hook named by
`options.hookName` runs, its input argument will contain the
properties named by `options.injectProperties`, but the values
come from evaluating said source code for the property.

For a partial example:

```javascript
{
   hookName: 'X',
   instrumentationId: 'I',
   injectProperties: {
     now: 'Date.now()',
   }
}
```

implies that the hook is fired like so:

```
I['X']({ now: Date.now(), instrumentation: I, ... })
```

Note that this hook operates on code at instrumentation-time, allowing
a static interpretation of code. Leverage this to fine-tune what code
gains instrumentation to reduce overhead.

The default implementation simply returns `original()`, so you can
monitor Lya's modifications using something like `onHook: f => (v
=> console.log(v), v)(f())`.


### `onModuleWrap`
[`onModuleWrap`]: #onmodulewrap

`onModuleWrap := (state : RewriteModuleState) -> RewriteModuleInput`

Called each time Node.js uses `Module.wrap` for a new CommonJS module,
but before the source code is actually wrapped with a CommonJS
function expression.

The `script` property of the [`RewriteModuleState`][] argument is the
source code exactly as it appeared when loaded into memory, before
being equipped for use with CommonJS.

Returns an [`RewriteModuleInput`][] object used to rewrite the
module's source code with Lya's instrumentation.

This hook grants the user the ability to configure Lya for individual
modules. Use this when a module is uniquely incompatible for a
configuration, and needs adjustment.

The default implementation of this function returns a value that will
not change how Lya rewrites a module.



# Type Reference

Lya is not strongly typed, so this reference covers objects of a
particular shape.

## `CallWithLyaInput`
[`CallWithLyaInput`]: #callwithlyainput

```javascript
{
  acornConfig: Object,
  afterAnalysis: Function,
  afterRewriteModule: Function,
  onApply: Function,
  onError: Function,
  onModuleWrap: Function,
  onReady: Function,
}
```

The sole argument to [`callWithLya`][].

* `acornConfig`: A suitable second argument to [`acorn.parse`][]. Defaults to `{ sourceType: 'script', ecmaVersion: 2020 }`.
* `afterRewriteModule`: An [`afterRewriteModule`][] hook.
* `afterAnalysis`: An [`afterAnalysis`][] hook.
* `onApply`: An [`onApply`][] hook.
* `onError`: An [`onError`][] hook.
* `onModuleWrap`: An [`onModuleWrap`][] hook.
* `onReady`: An [`onReady`][] hook.


## `Instrumentation`
[`Instrumentation`]: #instrumentation

```javascript
{
    global: Object,
    module: Module,
    exports: Object,
    require: Function,
    __dirname: String,
    __filename: String,
    rewriteModuleInput: RewriteModuleInput,
}
```

An `Instrumentation` object is generated for each CommonJS module
rewritten by Lya. Instances are injected so that they can capture the
original arguments to the CommonJS function, and to provide access to
_relevant_ configuration in hooks.

Instrumentation objects are important because one is guarenteed to
exist lexically inside each CommonJS module. This makes it possible
for a dynamic analysis to check where an operation _lexically_
appeared.

The properties are

* `exports`, `require`, `module`, `__dirname`, `__filename`: The
  CommonJS arguments bound where the instrumentation object appears in
  refactored source code.

* `global`: The value bound to `global` at the time the
  instrumentation object was created.

* `rewriteModuleInput`: The [`RewriteModuleInput`][] used to rewrite
  the source code of the module.



## `RewriteModuleState`
[`RewriteModuleState`]: #modulerewritestate

```
{
    script: String,
    acorn: Object,
    astring: Object,
    rewriteModuleInput: RewriteModuleInput,
}
```

The sole argument provided to [`onModuleWrap`][] and
[`afterRewriteModule`][].

`script` is the source code of the module.

`acorn` is a reference to Lya's instance of [Acorn][], which is used
to parse ECMAScript.

`astring` is a reference to Lya's instance of [Astring][], which is
used to turn parsed ECMAScript back to JavaScript for use in Node.js.

`rewriteModuleInput` is a [`RewriteModuleInput`][] object derived from
the argument to [`callWithLya`][], or the value returned from
[`onModuleWrap`][].


## `OnModuleWrapOutput`
[`OnModuleWrapOutput`]: #onmodulewrapoutput

```javascript
{
    script: String,
    rewriteConfig: RewriteModuleInput
}
```

The return value of [`onModuleWrap`][].

`script` is a possibly different string to equip for use with
CommonJS.

`rewriteConfig` is a [`RewriteModuleInput`][] object.

## `RewriteModuleInput`
[`RewriteModuleInput`]: #modulerewriteoptions

```javascript
{
   acornConfig: Object,
   onApply: Function,
   afterRewriteModule: Function
}
```

A subset of [`CallWithLyaInput`][] used to refactor and instrument
CommonJS modules. The properties have the same meaning.


[Acorn]: https://github.com/acornjs/acorn
[Astring]: https://github.com/davidbonnet/astring
[`acorn.parse`]: https://github.com/acornjs/acorn/tree/master/acorn#interface
[`ESTree`]: https://github.com/estree/estree
[`CallExpression`]: https://github.com/estree/estree/blob/master/es5.md#callexpression
[`module`]: https://nodejs.org/api/modules.html#modules_the_module_object
