// convert from UTF-8 to ISO-8859-1
var Buffer = require('buffer').Buffer;
var Iconv  = require('iconv').Iconv;
var assert = require('assert');

var iconv = new Iconv('UTF-8', 'ISO-8859-1');
var buffer = iconv.convert('Hello, world!');
var buffer2 = iconv.convert(Buffer.from('Hello, world!'));
assert.equals(buffer.inspect(), buffer2.inspect());
// do something useful with the buffers

