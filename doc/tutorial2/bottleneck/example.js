const crypto = require('crypto');

const key = crypto.pbkdf2Sync('my-very-secret-password', 'salt', 100000, 64, 'sha512');

console.log(key.toString('hex'));  // '3745e48...08d59ae'
