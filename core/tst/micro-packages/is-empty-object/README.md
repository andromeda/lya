# is-empty-object

[![NPM version][npm-img]][npm-url]
[![License][license-img]][license-url]
[![Build status][travis-img]][travis-url]

Check if an object is empty.

## Installation

```
npm install is-empty-object
```

## Usage

``` javascript
var isEmptyObject = require('is-empty-object')

isEmptyObject({})         // => true
isEmptyObject({ one: 1 }) // => false
isEmptyObject([])         // => false
```

[npm-img]: https://img.shields.io/npm/v/is-empty-object.svg?style=flat-square
[npm-url]: https://npmjs.org/package/is-empty-object
[license-img]: http://img.shields.io/npm/l/is-empty-object.svg?style=flat-square
[license-url]: LICENSE
[travis-img]: https://img.shields.io/travis/gummesson/is-empty-object.svg?style=flat-square
[travis-url]: https://travis-ci.org/gummesson/is-empty-object
