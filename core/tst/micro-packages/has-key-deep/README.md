hasKeyDeep
==========

[![Build Status](https://travis-ci.org/ryanaghdam/has-key-deep.svg?branch=master)](https://travis-ci.org/ryanaghdam/has-key-deep)

Deep-search objects for keys.  Keys can be searched by providing an array of
keys, or using a dot-notiation.

Examples
--------

Complete application

```javascript
hasKeyDeep({ a: { b: { c: 1 } } }, 'a.b.c') => true
hasKeyDeep({ a: { b: { c: 1 } } }, ['a', 'b', 'c']) => true
hasKeyDeep({ a: { b: { c: 1 } } }, 'a.b.c.d') => true
hasKeyDeep({ a: { b: { c: 1 } } }, 'a.c') => false
hasKeyDeep({}, 'a') => false
```


Partial application


```javascript
var hasABC = hasKeyDeep('a.b.c');
hasAbc({a: { b: { c: 1 } } }) => true
hasAbc({a: 1 }) => false
```
