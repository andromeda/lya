# txfm
Transformation pipeline

Exercise 1:

Write a function `wrap(o)` that, given an object `o`, wraps all the of the object's methods with counter-wrappers. Every time a method is called, its counter-wrapper will _increment_ and _print_ the counter corresponding to that function.

The object `o` will look like this:

```JavaScript
var o = {
  add: (a, b) => a + b,
  sub: (a, b) => a - b
}
```
