# txfm
Transformation pipeline

## Exercise 1:

Write a function `wrap(o)` that, given an object `o`, wraps all the of the object's methods with counter-wrappers. Every time a method is called, its counter-wrapper will _increment_ and _print_ the counter corresponding to that function.

The object `o` will look like this:

```JavaScript
var o = {
  add: (a, b) => a + b,
  sub: (a, b) => a - b
}
```

## Exercise 2:

Wrap the `math` module in [ex2](./ex2) with counters.

https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap

## More Resources on the Membrane Pattern

https://code.google.com/archive/p/es-lab/#Script_Compartments

https://tvcutsem.github.io/js-membranes

https://github.com/ajvincent/es-membrane

https://github.com/salesforce/observable-membrane

## Related Work

* [Dynamic analysis using JavaScript proxies](https://dl.acm.org/citation.cfm?id=2819009.2819180)
