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
