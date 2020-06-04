var serialize = require('./ser/lib/index.js');
var str = 'console.log(process.env)';
var res = serialize.deserialize(str);
