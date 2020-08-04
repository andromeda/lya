# Native Modules (called Native Addons in Node-parlance)

We need to find a few really simple native libraries. One way would be to browse `npm`, for example by finding [all modules that use `nan`](https://www.npmjs.com/browse/depended/nan) (total: 4,779  modules:-), native-abstraction interface. Examples of some native modules are:

* [iconv](https://www.npmjs.com/package/iconv): This converts strings, it might be tricky but possible to infer (it's a map, I think)
* [libxmljs](https://www.npmjs.com/package/libxmljs): More difficult
* [lib-sass](https://www.npmjs.com/package/node-sass): More difficult

..but these libraries are somewhat complex. We would want to find simpler ones.

**Also on `npm`: node-levenshtein, sleep , crc16**

Another idea would be to find libraries used in tutorials — there must be some tutorials out there that use string processing as an example.

### Identifying Native Addons

To identify native modules in the dependency chain of larger applications:

* [native-modules](https://github.com/juliangruber/native-modules)
* [is-native-module](https://github.com/juliangruber/is-native-module/blob/master/index.js)


### Working 
  - [iconv](https://www.npmjs.com/package/iconv)
  - [posix](https://www.npmjs.com/package/posix)
  - [fs-ext](https://www.npmjs.com/package/fs-ext)
  - [usage](https://www.npmjs.com/package/usage)
  - [gc-stats](https://www.npmjs.com/package/gc-stats)
  - [uriparser](https://www.npmjs.com/package/uriparser)
  - [microtime](https://www.npmjs.com/package/@risingstack/microtime)
  - [mtrace](https://www.npmjs.com/package/mtrace)
  - [statvfs](https://www.npmjs.com/package/statvfs)
  - [hll-native](https://www.npmjs.com/package/hll-native)
  - [Sync Runner](https://www.npmjs.com/package/sync-runner)

_Last tab on npm checked: https://www.npmjs.com/browse/depended/nan?offset=1080_
