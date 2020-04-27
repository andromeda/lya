Packages taken from [awesome npm packages](https://github.com/parro-it/awesome-micro-npm-packages)

Simple algorithm for automated runs:
1. identify absolute entry point (e.g., index.json)
2. set it as `includes` in both static and dynamic analysis
3. run them and compare results

List of repos are in [clone.sh](./clone.sh).

To run the tests without cloning the repos just run:
```shell
$ ./installNode.sh
$ ./run-check.sh
```
The output log is going to be stored in res.txt

## Explanation for differences 

### fs-promise

```javascript
 mzKeys.forEach(function(key){
  exports[key] = mzfs[key]
})
```

### is-generator

```javascript
function isGeneratorFunction (fn) {
 return typeof fn === 'function' &&
  fn.constructor &&
  fn.constructor.name === 'GeneratorFunction'
}
```
**Finds the fm.contructor is function**

### is-number

**Invalid accesses to isFinite.name**

### Periods

```javascript
function getter(name, value) {
    exports[name] = exports[pluraliseName(name)] = function(n) {
    return n == null ? value : n * value;
  };
  return value;
}
```
 
### concat-stream

**Invalid accesses to isArray because is declared with var**
Probably problem with the use of *with*

### file-size

```javascript
if (typeof module !== 'undefined' && module.exports) return module.exports = plugin()
```

### he

**Problems on various accesses**
exports.version, process.env.npm_package_keywords_4, exports.escape, unscape.name

### node-slug

**sees access to object exports**

 node-slug

 **sees access to object exports**

### normalize-pkg

**static analysis doesnt sees any object access?**

### set-value

**lya sees access on process.env.npm_package_keywords_15**

### static-prop

**lya sees access to exports object**

### syncthrough

**access to Function object probably through prototype or instance check**


