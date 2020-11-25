var test = require('./crypt3async.node');

const salt = '$1$SrkubyRm$DEQU3KupUxt4yfhbK1HyV/';
const key = 'Xz7sS6fEmnWScMb6Ayf363e5cdqF4Kh';
const cb = (err, value) => console.log(value);

test.crypt(key,salt, cb)
