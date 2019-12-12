# Implementation notes

Currently, the implementation comprises four files:

* [globals.json](./globals.json): A set of globally available names from EcmaScript and Node.js
* [prototypeGlobals.json](./prototypeGlobals.json): A set of prototype functions for globally available name.
* [staticGlobals.json](./staticGlobals.json): A set of global names part of the standard library.
* [txfm.js](./txfm.json): The main `lya` implementation.

## Main Implementation

Two levels:

* `console.log`: 
* `add`: 

+ Control functions to say what we want to exclude

## TODO

* Finish Refactoring (@gntousakis)

* Create configuration object (@nvasilakis)

* Complete policy 1 for all accesses
Both of the following are accesses:

```JavaScript
let f = Math.add 
f(1, 2)
Math.add(1, 2)
  ```

* Add a RWX (read-write-execute) policy instead of policy 1, where the cases below are distinct
```JavaScript
let f = Math.add  // R (read)
f(1, 2)
Math.add(1, 2) // X (execute)
Math.add = () => console.log("hello!"} // W (write)
```
One part is extraction (analysis a la policy 1) and 

* Clearup String from handlerObject

* Handle module cache and circular dependencies
