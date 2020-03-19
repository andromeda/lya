# Implementation notes

Currently, the implementation comprises four files:

* [globals.json](./globals.json): A set of globally available names from EcmaScript and Node.js
* [prototypeGlobals.json](./prototypeGlobals.json): A set of prototype functions for globally available name.
* [staticGlobals.json](./staticGlobals.json): A set of global names part of the standard library.
* [txfm.js](./txfm.js): The main `lya` implementation.

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

* [Policy 1](./policy1.js) - True/False: A simple access/ no access policy that checks if a obj has been used.
* [Policy 2](./policy2.js) - Counter: We track how many times a object has been accessed.
* [Policy 3](./policy3.js) - Time: A simple time counter 
* [Policy 4](./policy4.js) - Time2.0: A better timer counter that keeps the time counts on the module
* [Policy 5](./policy5.js) - Enforcement: If a module try to accesss any object outside of the dynamic.json file we
stop it from exec.
* [Policy 6](./policy6.js) - RWE: A read/ write/ execute analysis
* [Policy 7](./policy7.js) - Enforcement-RWE: If check if we try to access a module outside dynamic.json or if we try
to access a value diff than before(R and try RE, E and we try RW etc)
* [Policy 8](./policy8.js) - A simple true false analysis that tracks the access of the global object (console.log,Math etc). 
* [Policy 9](./policy9.js) - TypeOf analysis, that check the type of input and output on every export function we use.

## TODO

* Find large program (with regex) for testing timing (t3) (@nvasilakis)

* Code improvements for txfm (@nvasilakis)

* Create configuration object (@nvasilakis)

* Find more repos that our system plays right (@gntousakis)

* Clearup String from handlerObject

* Handle module cache and circular dependencies
