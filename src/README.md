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

