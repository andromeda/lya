[![Build Status](https://travis-ci.org/landau/zipmap.svg)](https://travis-ci.org/landau/zipmap)

zipmap
======

Returns a map with the keys mapped to the corresponding vals. `zipmap` also accepts a single value of objects or pairs.

> Note: If you use objects, you must use the props `key` and `value`

```js
/**
 * Returns a map with the keys mapped to the corresponding vals.
 *
 * @param {array} keys
 * @param {array} [vals]
 *
 * @return {object}
 */
function zipmap(keys, vals) { }
```

## Install

`npm i -S zipmap`

## Usage

```js
var assert = require('assert');
var zipmap = require('zipmap');

var keys = ['a', 'b', 'c'];
var vals = [1, 2, 3];

var map = zipmap(keys, vals);
assert.deepEqual(map, { a: 1, b: 2, c: 3 });
```

Or use an array of objects

```js
var objs = [
  { key: 'foo', value: 'bar' },
  { key: 'hi', value: 'bye' },
];

var out = {
  foo: 'bar',
  hi: 'bye'
};

var map = zipmap(objs);
assert.deepEqual(map, out);
```

or use an array of pairs

```js
var pairs = [
  ['foo', 'bar'],
  ['hi', 'bye']
];

var out = {
  foo: 'bar',
  hi: 'bye'
};

var map = zipmap(pairs);
assert.deepEqual(map, out);
```

## Changelog

#### 1.1.1

- Return empty obj when given an array of len 0

#### 1.1.0

- Add single argument handling which allows objects or pairs
