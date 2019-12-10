# Implementation notes

Currently, the implementation comprises four files:

* [globals.json](./globals.json): A set of globally available names from EcmaScript and Node.js
* [prototypeGlobals.json](./prototypeGlobals.json): A set of prototype functions for globally available name.
* [staticGlobals.json](./staticGlobals.json): A set of global names part of the standard library.
* [txfm.js](./txfm.json): The main `lya` implementation.

## Main Implementation
