# Lya: Library-oriented Dynamic Analysis for Node.js Programs

Mailing lists: [Commits](lya-commits@googlegroups.com) | [Discussion](lya-discuss@googlegroups.com)

Lya is an analysis framework for Node.js. Use Lya to identify and
address vulnerabilities, bottlenecks, and errors. Lya supplements its
dynamic analysis with lexical information, allowing analyses to reach
more useful conclusions.


# How to Use Lya

You can use Lya programmatically, or from a command-line utility.  The
methods are kept similar to make Lya easy to extend.


## Programmatic Use

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


## Command-Line Use

You can use the provided `lya` executable to designate a CommonJS
module to provide an argument to `callWithLya`.

For example, you can define a CommonJS module named `example.js`.  The
module must export a function that, when called, returns an object to
use with `callWithLya`.

The first argument, `argv`, is an array of _remaining_ arguments on
the command line (that is, the part of `process.argv` left over after
removing the arguments that led to calling `configureLya`).

The second argument, `lya`, is `===` to the `module.exports` set by
the main module of `lya`. This dependency injection pattern lets you
create custom launchers quickly.

```javascript
// example.js

module.exports = function configureLya(argv, lya) {
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


# Model

Lya instruments input CommonJS modules ("subjects") during runtime, in
response to a user calling `require` in the context of
[`callWithLya`][]. When Lya is actively instrumenting code, we say
that we are in "instrumentation time". Due to JavaScript's nature,
instrumentation time occurs in the Node.js runtime. However, Lya
forces instrumentation to occur before executing user code, allowing
programmers to reason about input JavaScript in source form.

During instrumentation time, Lya refactors CommonJS modules into a
functionally-equivalent form. A refactored subject includes its own
[`Instrumentation`][] object, which communicates both lexical and
dynamic information. The code will contain calls to user-provided
hooks, allowing users to either allow the existing code to run as it
was originally written, or to override the behavior.

To create a "coarse-grained" analysis with less overhead, a user may
configure exactly what statements and/or expressions are rewritten
using the [`onHook`][] hook. [`onHook`][] is a metaprogramming
facility that allows the user to extend instrumentation, or override
Lya's own static operations in a manner that resembles all other
hooks.

Lya's runtime shares the same V8 environment (Isolate, Context), which
means that there exist programs that may sabotage Lya's operation.
(e.g. damaging the global `Object` prototype).  This is an artifact of
Lya assuming that you _trust input code_, and it should preserve all
functionality.  To help you avoid breakages, Lya forces your code to
run in advance of a saboteur, such that you may override the behavior
of said saboteur.


# API Reference

## `callWithLya`
[`callWithLya`]: #callwithlya

`callWithLya := (config : CallWithLyaInput) -> Any`

e.g.

```javascript
const { callWithLya } = require("@andromeda/lya");

callWithLya(config)
```

Returns `config.onReady()`, or `config.onError(e)` for some caught
`e`. While control is in `config.onReady()`, Lya will auto-refactor
all files loaded as modules.

See [`CallWithLyaInput`][] for the supported keys.


## `findEntryModule`

`findEntryModule := (require := Function, userEntry := Any)`

Returns an argument suitable for use with the given `require`
function, or throws an error explaining why one cannot be determined.

If `require('path').resolve(process.cwd(), userEntry)` is an existing
file, then the value of that expression is returned. This is useful
for treating command line arguments as relative paths to the user's
working directory.


# Hook Reference
[hookref]: #hook-reference

In Lya, hooks are JavaScript functions called at well-defined times to
influence either Lya's behavior, or a subject's behavior. When and
where the hooks are called are significant.

Hooks are always normal JavaScript functions, but hooks injected into
subjects are typically [cross-phase hooks][].

Hooks may start with `on`, `before`, or `after` to clarify their
temporal relationship with an event.

## Cross-Phase Hooks
[cross-phase hook]: #cross-phase-hooks
[cross-phase hooks]: #cross-phase-hooks

`H := (original : Function, context : Object) -> String`

This is a base definition for **cross-phase hooks**, or hooks called
from injected code, in advance of program instructions. Cross-phase
hooks may review both dynamic and static information at runtime, and
are a strict subset of available hooks.

For a given ESTree node type `X`, Lya will look for a cross-phase hook
named `onX`. For example, a [`Literal`][] node causes Lya to look for
an `onLiteral` hook.  `onLiteral` would fire when the _runtime_
encounters the form expressed by the ESTree, and the hook may inspect
the original [`Literal`][] node. However, the source code will not be
altered to call the hook if the user did not provide a hook to use.

Hooks like this are implicitly defined for compatible ESTree nodes, so
many of them **are implicitly documented by this section**. Hooks that
are documented here will either extend this definition, or behave
entirely differently.

`original` is a thunk constructed by Lya that lexically wraps the
original source code. In most cases, `return original()` will execute
the original function and return the value the author intended.

`context` is an object clarifying the nature of the operation.

`context.instrumentation` is the [`Instrumentation`] object for the
module _lexically_ containing the operation.

`context.node` is the [ESTree][] expressing the operation.



## `afterAnalysis`
[`afterAnalysis`]: #afteranalysis

`afterAnalysis := Any -> Any`

Called exactly once after [`onReady`][] to perform postprocessing on
[`onReady`][]'s return value, but immediately before control leaves
[`callWithLya`][]. This hook determines the return value of
[`callWithLya`][].

The sole argument is the value returned from [`onReady`][].

The default implementation is the identity function.


## `afterRewriteModule`
[`afterRewriteModule`]: #aftermodulerewrite

`afterRewriteModule := (rwi : RewriteModuleInput) -> String`

Called after Lya rewrites the source code of a module using the given
[`RewriteModuleInput`][].

Returns the source code to actually execute as a new module in
Node.js. The `script` property of the input argument is the source
code of the module after Lya's instrumentation has been applied.

The default implementation only returns the `script` property of the
input argument.


## `onError`
[`onError`]: #onerror

`onError := (err : Any) -> Any`

Called exactly once when [`callWithLya`][] catches a thrown
value. `err` is normally an `Error`, but the sole argument is any
value caught by [`callWithLya`][].

This hook determines the return value of [`callWithLya`][] if it does
not re-throw its argument.

The default implementation simply throws its argument.


## `onCommonJsApply`
[`onCommonJsApply`]: #oncommonjsapply

`onCommonJsApply := (original : Function, inst : Instrumentation) -> Any`

A hook that fires in place of a function call for a CommonJS module to
analyze as a subject.

Returns a value to use as the return value of the function
representing the CommonJS module.

`original` is a thunk that applies and returns the function
encapsulating the subject as Node.js originally intended.

`inst` is an [`Instrumentation`][] containing the original `exports`,
`require`, `module`, `__dirname`, and `__filename` arguments meant for
the subject.

The default implementation simply returns `original()`.


## `onReady`
[`onReady`]: #onready

`onReady := () -> Any`

Called exactly once for every application of [`callWithLya`][] to
define an entry point for analysis. If `onReady` throws no error,
[`callWithLya`][] forwards its return value to [`afterAnalysis`][].


## `onCallExpression`
[`onCallExpression`]: #oncallexpression

```
onCallExpression := (original : Function, context : Object) -> Any
```

A [cross-phase hook][] that fires in place of a function call in a subject.

Returns a value for use where the call was hooked.

`context.target` is a reference to the function being called.
`context.args` is an array of arguments that would be passed to `target` if `original()` were called.


```javascript
function onCallExpression(continue) {
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
function onCallExpression() {
    return 'something completely different';
}
```


## `onHook`
[`onHook`]: #onhook

```
onHook := (original: Function, options: Object) -> Any
```

Called each time Lya is about to replace input code with an
instrumented functional equivalent. The injected code is expected to
call a user's hook.

`original` is a thunk that, when called, returns a string. The string
contains instrumented source code as Lya would inject it into a
subject. `options` holds information used to compute the value of
`original()`.

`options.instrumentationId`: A string form of the module-specific
identifier used to access the instrumentation object in the subject.

`options.instrumentation`: The [`Instrumentation`][] object bound to
`options.instrumentationId` in the subject.

`options.node`: The [`ESTree`][] object in the subject reflecting
source code that will be replaced.

`options.hookName`: The string name of a hook, suitable for use as an
object key (e.g. `'onCallExpression'`).

`options.isExpression`: A boolean indicating whether `options.node` is
an ECMAScript expression, as opposed to a statement or special
operator.

`options.injectProperties`: An object expressing generated source code
used to compute some hook arguments. When the hook named by
`options.hookName` runs, its input argument will contain the
properties named by `options.injectProperties`, but the values
come from evaluating said source code for the property.

For a strictly illustrative example:

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
I.rewriteModuleInput.callWithLyaInput['X']({
  now: Date.now(),
  instrumentation: I,
  ...,
})
```

Note that this hook operates on code at instrumentation-time, allowing
a static interpretation of code. Leverage this for metaprogramming,
specifically to select what code gains instrumentation to reduce
overhead.

The default implementation simply returns `original()`, so you can
monitor Lya's modifications using something like `f => (v =>
console.log(v), v)(f())`.


## `onModuleWrap`
[`onModuleWrap`]: #onmodulewrap

`onModuleWrap := (state : RewriteModuleInput) -> RewriteModuleInput`

Called each time Node.js uses `Module.wrap` for a new CommonJS module,
but before the source code is actually wrapped with a CommonJS
function expression.

The `script` property of the [`RewriteModuleInput`][] argument is the
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
  ...hooks
}
```

The sole argument to [`callWithLya`][].

* `acornConfig`: A suitable second argument to [`acorn.parse`][]. Defaults to `{ sourceType: 'script', ecmaVersion: 2020 }`.
* `...hooks`: any hook defined in the (Hook Reference)[hookref].

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

An `Instrumentation` object is a CommonJS module-specific object
injected into the runtime by Lya. Instrumentation captures original
arguments to the CommonJS function and the actual global object.

Instrumentation objects are important because one is guarenteed to
exist lexically inside each CommonJS module. This makes it possible
for a dynamic analysis to check where an operation _lexically_
appeared.

`exports`, `require`, `module`, `__dirname` and `__filename` are
  CommonJS arguments bound where the instrumentation object appears in
    refactored source code.

`global` is bound to the actual global object.

`rewriteModuleInput` is a [`RewriteModuleInput`][] object.  Use it to
understand configuration affecting the module.


## `RewriteModuleInput`
[`RewriteModuleInput`]: #rewritemoduleinput

```javascript
{
    script: String,
    acorn: Object,
    astring: Object,
    callWithLyaInput: CallWithLyaInput,
}
```

The sole argument provided to [`onModuleWrap`][] and
[`afterRewriteModule`][].

`script` is the source code of a module to rewrite.

`acorn` is a reference to Lya's instance of [Acorn][], which is used
to parse ECMAScript.

`astring` is a reference to Lya's instance of [Astring][], which is
used to turn parsed ECMAScript back to JavaScript for use in Node.js.

`callWithLyaInput`: A [`CallWithLyaInput`][] object.


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




[Acorn]: https://github.com/acornjs/acorn
[Astring]: https://github.com/davidbonnet/astring
[`acorn.parse`]: https://github.com/acornjs/acorn/tree/master/acorn#interface
[`ESTree`]: https://github.com/estree/estree
[`CallExpression`]: https://github.com/estree/estree/blob/master/es5.md#callexpression
[`Literal`]: https://github.com/estree/estree/blob/master/es5.md#literal
[`module`]: https://nodejs.org/api/modules.html#modules_the_module_object
