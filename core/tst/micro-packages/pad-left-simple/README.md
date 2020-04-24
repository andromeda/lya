# Pad left simple
[![Build Status](https://travis-ci.org/ycmjason/pad-left-simple.svg?branch=master)](https://travis-ci.org/ycmjason/pad-left-simple)

Pad left with some chars given a fixed length. An implementation of pad left at its simplest.

## Install
```
npm install --save pad-left-simple
```

## Usage
```javascript
var padLeft = require('pad-left-simple');

padLeft('hello', 10); // "     hello"
padLeft('10101', 10, '0'); // "0000010101"
```

## Test
```
npm test
```

## Why not other packages?
There is no other reason, this implementation is just simpler and might not be that efficient.
