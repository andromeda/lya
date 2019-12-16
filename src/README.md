# Implementation notes

Currently, the implementation comprises four files:

* [globals.json](./globals.json): A set of globally available names from EcmaScript and Node.js
* [prototypeGlobals.json](./prototypeGlobals.json): A set of prototype functions for globally available name.
* [staticGlobals.json](./staticGlobals.json): A set of global names part of the standard library.
* [txfm.js](./txfm.json): The main `lya` implementation.

## Main Implementation

We import the user choice. We import the right policy by importing the right module.
The execution begins and we wrap the main require in a proxy.

Every time we use the `require('xxx')` things happen on two levels: 

* The modules xxx code: This code runs for one time, only on the first import. 
We prepare all the global functions by wrapping them using `globalsDecl` function and 
then we pass them inside the module before runtime, using `vm.runInThisContext`.  
* The modules xxx export code: We wrap the export obj in a proxy. The idea is that we wrap
only the outside obj. Every time we access the object in order to call some of exported functions,
variables etc we wrap the specific thing to its own proxy.  

+ Control functions to say what we want to exclude

## Policies

* Policy 1 - True/False: A simple access/ no access policy that checks if a obj has been used.
* Policy 2 - Counter: We track how many times a object has been accessed.
* Policy 3 - Time: A simple time counter 
* Policy 4 - Time2.0: A better timer counter that keeps the time counts on the module
* Policy 5 - Enforcement: If a module try to accesss any object outside of the dynamic.json file we
stop it from exec.
* Policy 6 - RWE: A read/ write/ execute analysis

## TODO

* Finish Refactoring (@gntousakis)

* Find large program (with regex) for testing timing (t3) (@nvasilakis)

* Code improvements for txfm (@nvasilakis)

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
