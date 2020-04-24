# Missing Deep Keys

> Tells you what keys from one object are missing in another

[![npm](https://img.shields.io/npm/v/missing-deep-keys.svg?maxAge=2592000)](https://www.npmjs.com/package/missing-deep-keys)
[![Build Status](https://travis-ci.org/vladgolubev/missing-deep-keys.svg?branch=master)](https://travis-ci.org/vladgolubev/missing-deep-keys)
[![Coverage Status](https://coveralls.io/repos/github/vladgolubev/missing-deep-keys/badge.svg?branch=master)](https://coveralls.io/github/vladgolubev/missing-deep-keys?branch=master)
[![David](https://img.shields.io/david/vladgolubev/missing-deep-keys.svg?maxAge=2592000)](https://github.com/vladgolubev/missing-deep-keys)
[![Known Vulnerabilities](https://snyk.io/test/npm/missing-deep-keys/badge.svg)](https://snyk.io/test/npm/missing-deep-keys)
[![npm](https://img.shields.io/npm/dm/missing-deep-keys.svg?maxAge=2592000)](https://github.com/vladgolubev/missing-deep-keys)

## Install

Ensure you have [Node.js](https://nodejs.org) version 4 or higher installed. Then run the following:

```
$ npm install missing-deep-keys --save
```

## Usage

```javascript
const missingDeepKeys = require('missing-deep-keys');

const o1 = {a: {b: 2}}; // Base object
const o2 = {c: 1}; // Comparison object

const result = missingDeepKeys(o1, o2);

// Prints keys present in o1 but missing in o2
console.log(result); // => ['a.b']

// Additionally include a parent object if its children are missing
const result2 = missingDeepKeys(o1, o2, true);
console.log(result2); // => ['a', 'a.b']
```

## API

### missingDeepKeys(o1, o2, [showIntermediate])

Returns an array of keys present in o1 but missing in o2

| o1, o2         | showIntermediate   |
| -------------- | ------------------ |
| Object (`{}`)  | Boolean (`false`)  |

## Tests

```
$ npm run test
```

## Where is this library used?
If you are using this library in one of your projects, add it in this list. :sparkles:

* *Be the first one!*

## License

MIT © [Vlad Holubiev](https://github.com/vladgolubev)
