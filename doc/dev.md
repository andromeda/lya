
## Writing an analysis.

Lya provides the following hooks.

* `sourceTransform(src)`: Apply a source transformation to the loaded library. Example analyses: [uncomment](./src/uncomment.js).
  * `src`: String representation of the library
  * Expected `return`: a script representation of the library

* `onImport(caller, callee, name)`: Each time we load a library this hook is called. Usefull for dependency graphs. Analysis example: [print-require](./src/print-require.js)
  * `caller`: the path of the module that loads the module
  * `calle`: the path of the loaded library
  * `name`: the name of the library

* `onRead(target, name, ...)`: Each time we read a value from an imported module this function is called. Example Analysis:  [read-write-execute](./src/rwx.js)
  * `target`: The target object on which we get the property.
  * `name`: The name of the property
  * `nameToStore`: The recommended name to use by _Lya_.
  * `currentModule`: The name of the module that calls the function
  * `typeClass`: Indicates which category the analysis belongs to (_user-global, es-globals, node-globals etc_)

* `onCallPre(target, thisArg, ...)`: Before the execution of a function this hook is called. Example analysis: [profiling-relative](./src/profiling-relative.js)
  * `target`: The target function to call.
  * `thisArg`: The value of _this_ provided for the call to _target_.
  * `argumentsList`: An _array-like_ object specifying the arguments with which _target_ will be called.
  * `name`: The name of the function
  * `nameToStore`: Recommended name to use for storing the result of the analysis
  * `currentModule`: The name of the module that calls the function
  * `declareModule`: The name of the module where we declared the target function
  * `typeClass`: Indicates which category the analysis belongs to (_user-global, es-globals, node-globals etc_)

* `onCallPost(target, thisArg, ...)`: After the execution of a function this hooked is called. Extremly usefull for type analysis or time analysis. Example Analysis: [simple-types](./src/simple-types.js)
  * `target`: The target function to call.
  * `thisArg`: The value of _this_ provided for the call to _target_.
  * `argumentsList`: An _array-like_ object specifying the arguments with which _target_ will be called.
  * `name`: The name of the function
  * `nameToStore`: Recommended name to use for storing the result of the analysis
  * `currentModule`: The name of the module that calls the function
  * `declareModule`: The name of the module where we declared the target function
  * `typeClass`: Indicates which category the analysis belongs to (_user-global, es-globals, node-globals etc_)
  * `result`: It contains the result of the _target function_ execution.

* `onWrite(target, name, value, ...)`: This hook is called is called before we set a property on a object. Example Analysis: [read-write-execute](./src/rwx.js)
  * `target`: The target object on which to set the property
  * `name`: The name of the property to set
  * `value`: The value to set
  * `declareModule`: The name of the module where we declared the target function
  * `parentName`: The name of the parent object
  * `nameToStore`: Recommended name to use for storing the result of the analysis

* `onConstruct(target, args, currentName, nameToStore)`: We call this hook before the execution of a constructor.
  * `target`: The target function to call
  * `args`: An array-like object specifying the arguments with which target should be called
  * `currentName`: The name of the module where the constructor is called
  * `nameToStore`: Recommended name to use for storing the result of the analysis
  
* `onHas(target, prop, currentName, nameToStore)`: This method is called before you check if a property is in an object. 
  * `target`: The target object in which to look for the property
  * `prop`: The property we look for
  * `currentName`: The name of the module where the constructor is called
  * `nameToStore`: Recommended name to use for storing the result of the analysis

* `onExit(data)`: Last call before program exit -- commonly used for flushing results. Example analyses: [coarse-types](./src/coarse-types.js).
  * `data`: 
  * Expected `return`: None.
  
Lya provides the following utility function:

```JavaScript
const getObjectInfo = (obj) => {
      name: objName,
      path: objPath,
}
```
