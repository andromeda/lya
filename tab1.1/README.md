### fs-promise

Dynamically-computed access problem

```javascript
 mzKeys.forEach(function(key){
  exports[key] = mzfs[key]
})
```

### is-generator

`fn.constructor` -- stars, does not see function as parameter

```javascript
function isGeneratorFunction (fn) {
 return typeof fn === 'function' &&
  fn.constructor &&
  fn.constructor.name === 'GeneratorFunction'
}
```
Finds the fm.contructor is function

### is-number

Dynamically analysis `name` bug

Invalid accesses to isFinite.name

### Periods

Static analysis
Dynamic property property computation

```javascript
function getter(name, value) {
    exports[name] = exports[pluraliseName(name)] = function(n) {
    return n == null ? value : n * value;
  };
  return value;
}
```
 
### concat-stream

Dynamic adds `isArray`

Invalid accesses to isArray because is declared with var
Probably problem with the use of *with*

```
var isArray = Array.isArray || function (arr) {
  return Object.prototype.toString.call(arr) == '[object Array]'
}
```

### file-size

```javascript
if (typeof module !== 'undefined' && module.exports) return module.exports = plugin()
```

### he

Not in static analysis

Problems on various accesses

```
exports.version
process.env.npm_package_keywords_4
exports.escape, unscape.name
```

### node-slug

sees access to object exports

### normalize-pkg

static analysis doesnt sees any object access?

### set-value

lya sees access on `process.env.npm_package_keywords_15`

### static-prop

lya sees access to exports object

### syncthrough

access to Function object probably through prototype or instance check


