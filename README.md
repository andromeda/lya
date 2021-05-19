## Lya: Library-oriented Dynamic Analysis for Node.js Programs

Mailing lists: [Commits](lya-commits@googlegroups.com) | [Discussion](lya-discuss@googlegroups.com)

Lya is a coarse-grained dynamic analysis framework for Node.js. Use
Lya to identify and address vulnerabilities, bottlenecks, and errors.

“Coarse-grained” means that Lya limits analyses code to a lower level
of detail than alternatives—reducing overhead.


## How to Use Lya

Lya hooks into CommonJS, so you start an analysis using `require` while
Lya is active. Everything else is done using JavaScript functions as
hooks.

The simplest program uses only the [`onReady`][] hook.

```JavaScript
const { callWithLya } = require("@andromeda/lya");

callWithLya({
    onReady: () => require("./analyze-me.js"),
});
```

So as long as control remains in `onReady`, all `require` functions
will dynamically-rewrite code before running it in the current V8
Context. The rewritten code calls your hooks in advance of the
program's actual behavior.


## How to use Hooks

Each hook stands alone, but may be called with some of the same
information.  Pick the ones you need.

### `onReady`

```
onReady() -> Any
```

Fires exactly once for every application of `callWithLya`. While
control is in `onReady`, the Node.js `Module.wrap` function is
overridden. Any other modules `require`d within the extent of
`onReady` time will have their source code rewritten.

### `onApply`

```
onApply(original : Function, context : {
    module: Module,
    identifier: String | null,
    args: Array,
})
```

Arguments:

* `original`: A thunk constructed by Lya, wrapping the original call
  to the given function. Calling `original` will execute the
  original function as the author intended.

* `context`: An object clarifying the nature of the call.
  * `module`: The `module` object lexically containing where the hook was fired.
  * `identifier`: The string form of an identifier as it appears in
  source code, or `null` if an identifier cannot be determined. Useful
  for monitoring interactions with objects that have many possible
  names (e.g. If an operations targets `Object`, then `identifier`
  might be `"constructor"` if the original source refers to `Object`
  by that name)
  
Let's consider `onApply`. Let's assume this definition for a
JavaScript file called `ctor.js`:

```
function onApply(continue, { module, identifier }) {
    console.log(module.id);
    console.log(identifier);
    return continue();
}

function onReady() {
    require('./ctor.js');
}

callWithLya({ onApply, onReady });
```

`ctor.js` contains the following.

```
const x = constructor();
```

In this example, Lya will replace `constructor()` with something like this:

```javascript
__833848.onApply(function () {
    return constructor();
}, { identifier: "constructor", module, ... })
```

The program output would be

```
constructor
`/path/to/ctor.js
```

Notice that the configuration is injected into the code using a
cryptographically-random identifier to mitigate the risk of collisions
with code in the analysis subject. The reference is not visible on the
global object.

Capturing the identifier is important because `constructor.name ===
'Object'` in Node.js, and we may wish to distinguish between
operations that specifically target `Object`, and operations that
specifically target `constructor`. This makes Lya work with a mixture
of static and dynamic information.

The first function simply wraps the code that would have run anyway,
so it has access to the same scope as the original code. You can also
leverage this to control _when_ and _how_ that code runs, if at all.
Here are a couple of `onApply` hooks that illustrate this point:

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
// Affects ALL functions!
function onApply() {
    return 'something completely different';
}
```

This allows you to not only collect information, but also influence
program behavior. Since hooks must run in advance of source code, you
can leverage this to inject patches dynamically.
