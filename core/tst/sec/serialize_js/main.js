var serialize = require('./ser/lib/index.js');
var str = 'console.log(`exploited`)';
var res = serialize.deserialize(str);
