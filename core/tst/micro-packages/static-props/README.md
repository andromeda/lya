# static-props

> defines static object attributes using `Object.defineProperties`

[Installation](#installation) |
[Usage](#usage) |
[Annotated source](#annotated-source) |
[License](#license)

[![NPM version](https://badge.fury.io/js/static-props.svg)](http://badge.fury.io/js/static-props)
[![Build Status](https://travis-ci.org/fibo/static-props.svg?branch=master)](https://travis-ci.org/fibo/static-props?branch=master)
[![No deps](https://img.shields.io/badge/dependencies-none-green.svg)](https://github.com/fibo/strict-mode)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![KLP](https://img.shields.io/badge/kiss-literate-orange.svg)](http://g14n.info/kiss-literate-programming)

## Installation

With [npm](https://npmjs.org/) do

```bash
npm install static-props --save
```

## Usage

Let's create a classic Point2d class and add constant attributes.

```js
'use strict'

const staticProps = require('static-props')
// Or use ES6: import staticProps from 'static-props'

class Point2d {
  constructor (x, y, label) {
    // Suppose you have few static attributes in your class.
    const color = 'red'

    // Create a getter.
    const norm = () => x * x + y * y

    // Add constant attributes quickly.
    staticProps(this)({label, color, norm})

    // Add enumerable attributes.
    const enumerable = true
    staticProps(this)({x, y}, enumerable)
  }
}

// Add a static class attribute.
staticProps(Point2d)({ dim: 2 })

const norm = (x, y) => x * x + y * y
// A particular case are static methods, since they are functions
// they must be wrapped otherwise are considered as getters.
staticProps(Point2d)({ norm: () => norm })
```

After instantiating the class, we can check that its props cannot be changed.

```js
const p = new Point2d(1, 2)

// Trying to modify a static prop will throw, as expected.
p.label = 'B'
// TypeError: Cannot assign to read only property 'label' of #<Point2d>
```

Props *label* and *color* are values, while *norm* is a getter.

```js
console.log(p.label) // 'A'
console.log(p.color) // 'red'
console.log(p.norm) // 5 = 1 * 1 + 2 * 2
```

Attributes `x`, `y` were configured to be *enumerable*.

```js
console.log(p) // Point2d { x: 1, y: 2 }
```

You can access static class attributes and methods.

```js
console.log(Point2d.dim) // 2
console.log(Point2d.norm(1, 2)) // 5
```

## Annotated source

API is `staticProps(obj)(props[, enumerable])`.

Add every *prop* to *obj* as not writable nor configurable, i.e. **static**.
If prop is a function use it as a *getter*, otherwise use it as a *value*.
Finally, apply the [Object.defineProperties](https://developer.mozilla.org/it/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperties) function.

```javascript
/**
 * @param {Object} obj
 * @returns {Function}
 */
function staticProps (obj) {
  /**
   * @param {Object} props
   * @param {Boolean} [enumerable]
   */
  return function (props, enumerable) {
    var staticProps = {}

    for (var propName in props) {
      var staticProp = {
        configurable: false,
        enumerable: enumerable
      }

      var prop = props[propName]

      if (typeof prop === 'function') {
        staticProp.get = prop
      } else {
        staticProp.value = prop

        staticProp.writable = false
      }

      staticProps[propName] = staticProp
    }

    Object.defineProperties(obj, staticProps)
  }
}
```

Export function, supporting both CommonJS and ES6.

```javascript
module.exports = exports.default = staticProps
```

## License

[MIT](http://g14n.info/mit-license)
