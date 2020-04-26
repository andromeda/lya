'use strict';

const Normalizer = require('./');
const config = new Normalizer();

console.log(JSON.stringify(config.normalize(require('./test/fixtures/people')), null, 2));

console.log(JSON.stringify(config.normalize(require('./test/fixtures/bin'), {
  only: ['bin', 'name']
}), null, 2));
