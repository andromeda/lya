# Implementation notes

Currently, the implementation comprises four files:

* [txfm.js](./txfm.js): The main `lya` implementation.
* [default-names.json](./default-names.json): A set of globally available names used in `lya`.
* [config.js](./config.js): A set of default values in order to start `lya` up.
* [utils.js](./utils.js): ?????

## Analysis

* [Call-Numbers](./call-numbers.js): We track how many times a object has been accessed. Usefull for fixing performance pathologies. 
* [Coarse-Types](./coarse-types.js ): It lists all the functions that have been. Usefull for detecting interface types.
* [Export-Type](./export-type.js): Usefull analysis that displays all the inputs of function and all the output. 
For example, if we have an `add(a, b) => a + b` it will display "input: number, number => output: number"
* [Global-Only](./global-only.js): A simple analysis that display all access to `global` object.
* [On-Off](./on-off.js): A simple access/ no access policy that checks if a obj has been used.
* [On-Off Enforcement](./on-off-enforcement.js ): We use as a ground truth the results of the `Allow-Deny analysis`. 
If the is a change from the the ground truth the analysis informs the user. Especialy usefull for access control and security
check.
* [Print-Require](./print-require.js): Each time we import a library, this analysis displays a message. Usefull for 
creating the depentecy graph.
* [Profiling-Relative](./profiling-relative.js): A better timer counter that keeps the time counts on the module.
Usefull for detecting performance pathologies.
* [Read-Write-Execute](./rwx.js): A read/ write/ execute analysis. 
* [Read-Write-Execute Enforcement](./rwx-enforcement.js): We use as ground truth the result of `rwx` analysis.
If check if we try to access a module outside dynamic.json or if we try to access a value diff than before(R and try RE, E and we try RW etc).
* [Simple-Types](./simple-types.js): A simple type analysis. 
* [star-Check](./star-check.js) - This analysis is better used in compination of a static analysis. 
* [Term-Index](./term-index.js): ????
* [Uncomment](./uncomment.js): Remove all comments from the module we load. Displays the ability of `lya` to perform source manipulation.

### Analysis examples

Below are some examples of simple analyses:

* `Global check`: Counts all acceses to the global object
```Javascript
let count = 0;
const onCallPre = (target, thisArg, argumentsList, name, nameToStore,
    currentModule, declareModule, typeClass) => {
  if (global[target]) {
    count++;
  };
};
```

* `Print on Import`: Every time we import a library the analysis displays a message
```Javascript
const onImport = (caller, callee, name) => {
  console.log('lya:', caller, 'imports', callee, name);
};
```

* `Remove comments`: We manipulate the source and we remove all comments from the imported module
```Javascript
const sourceTransform = (src) => src.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
```
### Analysis Result Example

We run `lya` on the following code with the `Read-Write-Execute Analysis`. 
```javascript
\\ main.js
const m1 = require('./m1.js');
m1.w = m1.x(m1.r)
```
```javascipt
\\ m1.js
module.exports = {
  r: () => 'r',
  w: () => 'w',
  x: () => 'x'
};
```
And we got the following output result in a `json` file:
```javascript
{
  "path/main.js": {
    "require": "rx",
    "require('./m1.js')": "ir",
    "require('./m1.js').x": "rx",
    "require('./m1.js').r": "r",
    "require('./m1.js').w": "w"
  },
  "path/m1.js": {
    "module": "r",
    "module.exports": "w"
  }
}
```

