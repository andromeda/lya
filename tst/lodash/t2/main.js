lyaConfig = {
  SAVE_RESULTS: require("path").join(__dirname, "dynamic.json"),
  analysisCh: 1,
};
let lya = require("../../../src/txfm.js");
require = lya.configRequire(require, lyaConfig);

const _ = require("lodash");

let nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];

let c1 = _.chunk(nums, 2);
console.log(c1);

let c2 = _.chunk(nums, 3);
console.log(c2);

nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];

c1 = _.slice(nums, 2, 6);
console.log(c1);

c2 = _.slice(nums, 0, 8);
console.log(c2);

var r = _.random(10);
console.log(r);

r = _.random(5, 10);
console.log(r);

words = ['sky', 'wood', 'forest', 'falcon', 
    'pear', 'ocean', 'universe'];

let word = _.sample(words);
console.log(word);

words = ['sky', 'wood', 'forest', 'falcon', 
    'pear', 'ocean', 'universe'];

console.log(_.shuffle(words));
console.log(_.shuffle(words));
console.log(_.shuffle(words));
console.log(words);

_.times(4, () => {

    console.log("brave");
})

require('./m1.js');