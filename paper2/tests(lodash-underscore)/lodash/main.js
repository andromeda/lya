lyaConfig = {
    SAVE_RESULTS: require("path").join(__dirname, "dynamic.json"),
    analysisCh: 9,
    removejson: ['hasOwnProperty'],
};
let lya = require("../../../src/txfm.js");
require = lya.configRequire(require, lyaConfig);
const lodash = require('lodash');

// lodash.chunk
lodash.chunk(['a', 'b', 'c', 'd'], 2);
lodash.chunk(['a', 'b', 'c', 'd'], 3);

// lodash.compact
lodash.compact([0, 1, false, 2, '', 3]);
// => [1, 2, 3]

// lodash.concat(array, [values])
let array = [1];
var other = lodash.concat(array, 2, [3], [[4]]);

console.log(other);
// => [1, 2, 3, [4]]

console.log(array);
// => [1]

// lodash.difference(array, [values])
lodash.difference([2, 1], [2, 3]);
// => [1]

// lodash.differenceBy(array, [values], [iteratee=lodash.identity])
lodash.differenceBy([2.1, 1.2], [2.3, 3.4], Math.floor);
// => [1.2]
// The `lodash.property` iteratee shorthand.
lodash.differenceBy([{'x': 2}, {'x': 1}], [{'x': 1}], 'x');
// => [{ 'x': 2 }]

// lodash.differenceWith(array, [values], [comparator])
let objects = [{'x': 1, 'y': 2}, {'x': 2, 'y': 1}];
lodash.differenceWith(objects, [{'x': 1, 'y': 2}], lodash.isEqual);
// => [{ 'x': 2, 'y': 1 }]

// ##lodash.drop(array, [n=1])
lodash.drop([1, 2, 3]);
// => [2, 3]
lodash.drop([1, 2, 3], 2);
// => [3]
lodash.drop([1, 2, 3], 5);
// => []
lodash.drop([1, 2, 3], 0);
// => [1, 2, 3]

// lodash.dropRight(array, [n=1])
lodash.dropRight([1, 2, 3]);
// => [1, 2]
lodash.dropRight([1, 2, 3], 2);
// => [1]
lodash.dropRight([1, 2, 3], 5);
// => []
lodash.dropRight([1, 2, 3], 0);
// => [1, 2, 3]


// lodash.dropRightWhile(array, [predicate=lodash.identity])

let users = [
  {'user': 'barney', 'active': true},
  {'user': 'fred', 'active': false},
  {'user': 'pebbles', 'active': false}];

lodash.dropRightWhile(users, function(o) {
  return !o.active;
});
// => objects for ['barney']
// The `lodash.matches` iteratee shorthand.
lodash.dropRightWhile(users, {'user': 'pebbles', 'active': false});
// => objects for ['barney', 'fred']
// The `lodash.matchesProperty` iteratee shorthand.
lodash.dropRightWhile(users, ['active', false]);
// => objects for ['barney']
// The `lodash.property` iteratee shorthand.
lodash.dropRightWhile(users, 'active');
// => objects for ['barney', 'fred', 'pebbles']

// lodash.dropWhile(array, [predicate=lodash.identity])

users = [
  {'user': 'barney', 'active': false},
  {'user': 'fred', 'active': false},
  {'user': 'pebbles', 'active': true}];

lodash.dropWhile(users, function(o) {
  return !o.active;
});
// => objects for ['pebbles']

// The `lodash.matches` iteratee shorthand.
lodash.dropWhile(users, {'user': 'barney', 'active': false});
// => objects for ['fred', 'pebbles']

// The `lodash.matchesProperty` iteratee shorthand.
lodash.dropWhile(users, ['active', false]);
// => objects for ['pebbles']

// The `lodash.property` iteratee shorthand.
lodash.dropWhile(users, 'active');
// => objects for ['barney', 'fred', 'pebbles']

//lodash.fill(array, value, [start=0], [end=array.length])
array = [1, 2, 3];
 
lodash.fill(array, 'a');
console.log(array);
// => ['a', 'a', 'a']
 
lodash.fill(Array(3), 2);
// => [2, 2, 2]
 
lodash.fill([4, 6, 8, 10], '*', 1, 3);
// => [4, '*', '*', 10]

// lodash.findIndex(array, [predicate=lodash.identity], [fromIndex=0])
users = [
    { 'user': 'barney',  'active': false },
    { 'user': 'fred',    'active': false },
    { 'user': 'pebbles', 'active': true }
  ];
   
  lodash.findIndex(users, function(o) { return o.user == 'barney'; });
  // => 0
   
  // The `lodash.matches` iteratee shorthand.
  lodash.findIndex(users, { 'user': 'fred', 'active': false });
  // => 1
   
  // The `lodash.matchesProperty` iteratee shorthand.
  lodash.findIndex(users, ['active', false]);
  // => 0
   
  // The `lodash.property` iteratee shorthand.
  lodash.findIndex(users, 'active');
  // => 2

 // lodash.findLastIndex(array, [predicate=lodash.identity], [fromIndex=array.length-1])

 users = [
    { 'user': 'barney',  'active': true },
    { 'user': 'fred',    'active': false },
    { 'user': 'pebbles', 'active': false }
  ];
   
  lodash.findLastIndex(users, function(o) { return o.user == 'pebbles'; });
  // => 2
   
  // The `lodash.matches` iteratee shorthand.
  lodash.findLastIndex(users, { 'user': 'barney', 'active': true });
  // => 0
   
  // The `lodash.matchesProperty` iteratee shorthand.
  lodash.findLastIndex(users, ['active', false]);
  // => 2
   
  // The `lodash.property` iteratee shorthand.
  lodash.findLastIndex(users, 'active');
  // => 0

// lodash.flatten(array)
lodash.flatten([1, [2, [3, [4]], 5]]);
// => [1, 2, [3, [4]], 5]

// lodash.flattenDeep(array)
lodash.flattenDeep([1, [2, [3, [4]], 5]]);
// => [1, 2, 3, 4, 5]

// lodash.flattenDepth(array, [depth=1])
array = [1, [2, [3, [4]], 5]];
 
lodash.flattenDepth(array, 1);
// => [1, 2, [3, [4]], 5]
 
lodash.flattenDepth(array, 2);
// => [1, 2, 3, [4], 5]

//lodash.fromPairs(pairs)
lodash.fromPairs([['a', 1], ['b', 2]]);
// => { 'a': 1, 'b': 2 }

lodash.head([1, 2, 3]);
// => 1
 
lodash.head([]);
// => undefined
lodash.intersectionBy([2.1, 1.2], [2.3, 3.4], Math.floor);
// => [2.1]
 
// The `lodash.property` iteratee shorthand.
lodash.intersectionBy([{ 'x': 1 }], [{ 'x': 2 }, { 'x': 1 }], 'x');
// => [{ 'x': 1 }]

objects = [{ 'x': 1, 'y': 2 }, { 'x': 2, 'y': 1 }];
var others = [{ 'x': 1, 'y': 1 }, { 'x': 1, 'y': 2 }];
 
lodash.intersectionWith(objects, others, lodash.isEqual);
// => [{ 'x': 1, 'y': 2 }]

lodash.join(['a', 'b', 'c'], '~');
// => 'a~b~c'

lodash.last([1, 2, 3]);
// => 3

lodash.lastIndexOf([1, 2, 1, 2], 2);
// => 3
 
// Search from the `fromIndex`.
lodash.lastIndexOf([1, 2, 1, 2], 2, 2);
// => 1

array = ['a', 'b', 'c', 'd'];
 
lodash.nth(array, 1);
// => 'b'
 
lodash.nth(array, -2);
// => 'c';

array = ['a', 'b', 'c', 'a', 'b', 'c'];
 
lodash.pull(array, 'a', 'c');
console.log(array);
// => ['b', 'b']

array = ['a', 'b', 'c', 'a', 'b', 'c'];
 
lodash.pullAll(array, ['a', 'c']);
console.log(array);
// => ['b', 'b']

array = [{ 'x': 1 }, { 'x': 2 }, { 'x': 3 }, { 'x': 1 }];
 
lodash.pullAllBy(array, [{ 'x': 1 }, { 'x': 3 }], 'x');
console.log(array);
// => [{ 'x': 2 }]

array = [{ 'x': 1, 'y': 2 }, { 'x': 3, 'y': 4 }, { 'x': 5, 'y': 6 }];
 
lodash.pullAllWith(array, [{ 'x': 3, 'y': 4 }], lodash.isEqual);
console.log(array);
// => [{ 'x': 1, 'y': 2 }, { 'x': 5, 'y': 6 }]

array = ['a', 'b', 'c', 'd'];
var pulled = lodash.pullAt(array, [1, 3]);
 
console.log(array);
// => ['a', 'c']
 
console.log(pulled);
// => ['b', 'd']

 array = [1, 2, 3, 4];
var evens = lodash.remove(array, function(n) {
  return n % 2 == 0;
});
 
console.log(array);
// => [1, 3]
 
console.log(evens);
// => [2, 4]

array = [1, 2, 3];
 
lodash.reverse(array);
// => [3, 2, 1]
 
console.log(array);
// => [3, 2, 1]

lodash.sortedIndex([30, 50], 40);
// => 1

objects = [{ 'x': 4 }, { 'x': 5 }];
 
lodash.sortedIndexBy(objects, { 'x': 4 }, function(o) { return o.x; });
// => 0
 
// The `lodash.property` iteratee shorthand.
lodash.sortedIndexBy(objects, { 'x': 4 }, 'x');
// => 0

lodash.sortedIndexOf([4, 5, 5, 5, 6], 5);
// => 1

lodash.sortedLastIndex([4, 5, 5, 5, 6], 5);
// => 4

objects = [{ 'x': 4 }, { 'x': 5 }];
 
lodash.sortedLastIndexBy(objects, { 'x': 4 }, function(o) { return o.x; });
// => 1
 
// The `lodash.property` iteratee shorthand.
lodash.sortedLastIndexBy(objects, { 'x': 4 }, 'x');
// => 1

lodash.sortedLastIndexOf([4, 5, 5, 5, 6], 5);
// => 3

lodash.sortedUniq([1, 1, 2]);
// => [1, 2]

lodash.sortedUniqBy([1.1, 1.2, 2.3, 2.4], Math.floor);
// => [1.1, 2.3]

lodash.tail([1, 2, 3]);
// => [2, 3]

lodash.take([1, 2, 3]);
// => [1]
 
lodash.take([1, 2, 3], 2);
// => [1, 2]
 
lodash.take([1, 2, 3], 5);
// => [1, 2, 3]
 
lodash.take([1, 2, 3], 0);
// => []

lodash.takeRight([1, 2, 3]);
// => [3]
 
lodash.takeRight([1, 2, 3], 2);
// => [2, 3]
 
lodash.takeRight([1, 2, 3], 5);
// => [1, 2, 3]
 
lodash.takeRight([1, 2, 3], 0);
// => []

 users = [
    { 'user': 'barney',  'active': true },
    { 'user': 'fred',    'active': false },
    { 'user': 'pebbles', 'active': false }
  ];
   
  lodash.takeRightWhile(users, function(o) { return !o.active; });
  // => objects for ['fred', 'pebbles']
   
  // The `lodash.matches` iteratee shorthand.
  lodash.takeRightWhile(users, { 'user': 'pebbles', 'active': false });
  // => objects for ['pebbles']
   
  // The `lodash.matchesProperty` iteratee shorthand.
  lodash.takeRightWhile(users, ['active', false]);
  // => objects for ['fred', 'pebbles']
   
  // The `lodash.property` iteratee shorthand.
  lodash.takeRightWhile(users, 'active');
  // => []

users = [
    { 'user': 'barney',  'active': false },
    { 'user': 'fred',    'active': false },
    { 'user': 'pebbles', 'active': true }
  ];
   
  lodash.takeWhile(users, function(o) { return !o.active; });
  // => objects for ['barney', 'fred']
   
  // The `lodash.matches` iteratee shorthand.
  lodash.takeWhile(users, { 'user': 'barney', 'active': false });
  // => objects for ['barney']
   
  // The `lodash.matchesProperty` iteratee shorthand.
  lodash.takeWhile(users, ['active', false]);
  // => objects for ['barney', 'fred']
   
  // The `lodash.property` iteratee shorthand.
  lodash.takeWhile(users, 'active');
  // => []

  lodash.union([2], [1, 2]);
  // => [2, 1]

  lodash.unionBy([2.1], [1.2, 2.3], Math.floor);
// => [2.1, 1.2]
 
// The `lodash.property` iteratee shorthand.
lodash.unionBy([{ 'x': 1 }], [{ 'x': 2 }, { 'x': 1 }], 'x');
// => [{ 'x': 1 }, { 'x': 2 }]

objects = [{ 'x': 1, 'y': 2 }, { 'x': 2, 'y': 1 }];
 others = [{ 'x': 1, 'y': 1 }, { 'x': 1, 'y': 2 }];
 
lodash.unionWith(objects, others, lodash.isEqual);
// => [{ 'x': 1, 'y': 2 }, { 'x': 2, 'y': 1 }, { 'x': 1, 'y': 1 }]

lodash.uniq([2, 1, 2]);
// => [2, 1]

lodash.uniqBy([2.1, 1.2, 2.3], Math.floor);
// => [2.1, 1.2]
 
// The `lodash.property` iteratee shorthand.
lodash.uniqBy([{ 'x': 1 }, { 'x': 2 }, { 'x': 1 }], 'x');
// => [{ 'x': 1 }, { 'x': 2 }]

objects = [{ 'x': 1, 'y': 2 }, { 'x': 2, 'y': 1 }, { 'x': 1, 'y': 2 }];
 
lodash.uniqWith(objects, lodash.isEqual);
// => [{ 'x': 1, 'y': 2 }, { 'x': 2, 'y': 1 }]

var zipped = lodash.zip(['a', 'b'], [1, 2], [true, false]);
// => [['a', 1, true], ['b', 2, false]]
 
lodash.unzip(zipped);
// => [['a', 'b'], [1, 2], [true, false]]

zipped = lodash.zip([1, 2], [10, 20], [100, 200]);
// => [[1, 10, 100], [2, 20, 200]]
 
lodash.unzipWith(zipped, lodash.add);
// => [3, 30, 300]

lodash.without([2, 1, 2, 3], 1, 2);
// => [3]

lodash.xor([2, 1], [2, 3]);
// => [1, 3]

lodash.xorBy([2.1, 1.2], [2.3, 3.4], Math.floor);
// => [1.2, 3.4]
 
// The `lodash.property` iteratee shorthand.
lodash.xorBy([{ 'x': 1 }], [{ 'x': 2 }, { 'x': 1 }], 'x');
// => [{ 'x': 2 }]


objects = [{ 'x': 1, 'y': 2 }, { 'x': 2, 'y': 1 }];
others = [{ 'x': 1, 'y': 1 }, { 'x': 1, 'y': 2 }];
 
lodash.xorWith(objects, others, lodash.isEqual);
// => [{ 'x': 2, 'y': 1 }, { 'x': 1, 'y': 1 }]

lodash.zip(['a', 'b'], [1, 2], [true, false]);
// => [['a', 1, true], ['b', 2, false]]

lodash.zipObject(['a', 'b'], [1, 2]);
// => { 'a': 1, 'b': 2 }

lodash.zipObjectDeep(['a.b[0].c', 'a.b[1].d'], [1, 2]);
// => { 'a': { 'b': [{ 'c': 1 }, { 'd': 2 }] } }

lodash.zipWith([1, 2], [10, 20], [100, 200], function(a, b, c) {
    return a + b + c;
  });
  // => [111, 222]

lodash.countBy([6.1, 4.2, 6.3], Math.floor);
// => { '4': 1, '6': 2 }
 
// The `lodash.property` iteratee shorthand.
lodash.countBy(['one', 'two', 'three'], 'length');
// => { '3': 2, '5': 1 }

lodash.every([true, 1, null, 'yes'], Boolean);
// => false
 
users = [
  { 'user': 'barney', 'age': 36, 'active': false },
  { 'user': 'fred',   'age': 40, 'active': false }
];
 
// The `lodash.matches` iteratee shorthand.
lodash.every(users, { 'user': 'barney', 'active': false });
// => false
 
// The `lodash.matchesProperty` iteratee shorthand.
lodash.every(users, ['active', false]);
// => true
 
// The `lodash.property` iteratee shorthand.
lodash.every(users, 'active');
// => false


users = [
    { 'user': 'barney', 'age': 36, 'active': true },
    { 'user': 'fred',   'age': 40, 'active': false }
  ];
   
  lodash.filter(users, function(o) { return !o.active; });
  // => objects for ['fred']
   
  // The `lodash.matches` iteratee shorthand.
  lodash.filter(users, { 'age': 36, 'active': true });
  // => objects for ['barney']
   
  // The `lodash.matchesProperty` iteratee shorthand.
  lodash.filter(users, ['active', false]);
  // => objects for ['fred']
   
  // The `lodash.property` iteratee shorthand.
  lodash.filter(users, 'active');
  // => objects for ['barney']

users = [
    { 'user': 'barney',  'age': 36, 'active': true },
    { 'user': 'fred',    'age': 40, 'active': false },
    { 'user': 'pebbles', 'age': 1,  'active': true }
  ];
   
  lodash.find(users, function(o) { return o.age < 40; });
  // => object for 'barney'
   
  // The `lodash.matches` iteratee shorthand.
  lodash.find(users, { 'age': 1, 'active': true });
  // => object for 'pebbles'
   
  // The `lodash.matchesProperty` iteratee shorthand.
  lodash.find(users, ['active', false]);
  // => object for 'fred'
   
  // The `lodash.property` iteratee shorthand.
  lodash.find(users, 'active');
  // => object for 'barney'

  lodash.findLast([1, 2, 3, 4], function(n) {
    return n % 2 == 1;
  });
  // => 3

function duplicate(n) {
    return [n, n];
  }
   
  lodash.flatMap([1, 2], duplicate);
  // => [1, 1, 2, 2]

  function duplicate(n) {
    return [[[n, n]]];
  }
   
  lodash.flatMapDeep([1, 2], duplicate);
  // => [1, 1, 2, 2]

function duplicate(n) {
  return [[[n, n]]];
}
 
lodash.flatMapDepth([1, 2], duplicate, 2);
// => [[1, 1], [2, 2]]


lodash.forEach([1, 2], function(value) {
    console.log(value);
  });
  // => Logs `1` then `2`.
   
  lodash.forEach({ 'a': 1, 'b': 2 }, function(value, key) {
    console.log(key);
  });
  // => Logs 'a' then 'b' (iteration order is not guaranteed).

  lodash.forEachRight([1, 2], function(value) {
    console.log(value);
  });
  // => Logs `2` then `1`


  lodash.groupBy([6.1, 4.2, 6.3], Math.floor);
  // => { '4': [4.2], '6': [6.1, 6.3] }
   
  // The `lodash.property` iteratee shorthand.
  lodash.groupBy(['one', 'two', 'three'], 'length');
  // => { '3': ['one', 'two'], '5': ['three'] }

  lodash.includes([1, 2, 3], 1);
  // => true
   
  lodash.includes([1, 2, 3], 1, 2);
  // => false
   
  lodash.includes({ 'a': 1, 'b': 2 }, 1);
  // => true
   
  lodash.includes('abcd', 'bc');
  // => true


lodash.invokeMap([[5, 1, 7], [3, 2, 1]], 'sort');
// => [[1, 5, 7], [1, 2, 3]]
 
lodash.invokeMap([123, 456], String.prototype.split, '');
// => [['1', '2', '3'], ['4', '5', '6']]

array = [
    { 'dir': 'left', 'code': 97 },
    { 'dir': 'right', 'code': 100 }
  ];
   
  lodash.keyBy(array, function(o) {
    return String.fromCharCode(o.code);
  });
  // => { 'a': { 'dir': 'left', 'code': 97 }, 'd': { 'dir': 'right', 'code': 100 } }
   
  lodash.keyBy(array, 'dir');
  // => { 'left': { 'dir': 'left', 'code': 97 }, 'right': { 'dir': 'right', 'code': 100 } }

  function square(n) {
    return n * n;
  }
   
  lodash.map([4, 8], square);
  // => [16, 64]
   
  lodash.map({ 'a': 4, 'b': 8 }, square);
  // => [16, 64] (iteration order is not guaranteed)
   
  users = [
    { 'user': 'barney' },
    { 'user': 'fred' }
  ];
   
  // The `lodash.property` iteratee shorthand.
  lodash.map(users, 'user');
  // => ['barney', 'fred']

users = [
    { 'user': 'fred',   'age': 48 },
    { 'user': 'barney', 'age': 34 },
    { 'user': 'fred',   'age': 40 },
    { 'user': 'barney', 'age': 36 }
  ];
   
  // Sort by `user` in ascending order and by `age` in descending order.
  lodash.orderBy(users, ['user', 'age'], ['asc', 'desc']);
  // => objects for [['barney', 36], ['barney', 34], ['fred', 48], ['fred', 40]]


users = [
    { 'user': 'barney',  'age': 36, 'active': false },
    { 'user': 'fred',    'age': 40, 'active': true },
    { 'user': 'pebbles', 'age': 1,  'active': false }
  ];
   
  lodash.partition(users, function(o) { return o.active; });
  // => objects for [['fred'], ['barney', 'pebbles']]
   
  // The `lodash.matches` iteratee shorthand.
  lodash.partition(users, { 'age': 1, 'active': false });
  // => objects for [['pebbles'], ['barney', 'fred']]
   
  // The `lodash.matchesProperty` iteratee shorthand.
  lodash.partition(users, ['active', false]);
  // => objects for [['barney', 'pebbles'], ['fred']]
   
  // The `lodash.property` iteratee shorthand.
  lodash.partition(users, 'active');
  // => objects for [['fred'], ['barney', 'pebbles']]

  lodash.reduce([1, 2], function(sum, n) {
    return sum + n;
  }, 0);
  // => 3
   
  lodash.reduce({ 'a': 1, 'b': 2, 'c': 1 }, function(result, value, key) {
    (result[value] || (result[value] = [])).push(key);
    return result;
  }, {});
  // => { '1': ['a', 'c'], '2': ['b'] } (iteration order is not guaranteed)

 array = [[0, 1], [2, 3], [4, 5]];
 
  lodash.reduceRight(array, function(flattened, other) {
    return flattened.concat(other);
  }, []);
  // => [4, 5, 2, 3, 0, 1]

  users = [
    { 'user': 'barney', 'age': 36, 'active': false },
    { 'user': 'fred',   'age': 40, 'active': true }
  ];
   
  lodash.reject(users, function(o) { return !o.active; });
  // => objects for ['fred']
   
  // The `lodash.matches` iteratee shorthand.
  lodash.reject(users, { 'age': 40, 'active': true });
  // => objects for ['barney']
   
  // The `lodash.matchesProperty` iteratee shorthand.
  lodash.reject(users, ['active', false]);
  // => objects for ['fred']
   
  // The `lodash.property` iteratee shorthand.
  lodash.reject(users, 'active');
  // => objects for ['barney']

  lodash.sample([1, 2, 3, 4]);
// => 2

lodash.sampleSize([1, 2, 3], 2);
// => [3, 1]
 
lodash.sampleSize([1, 2, 3], 4);
// => [2, 3, 1]

lodash.shuffle([1, 2, 3, 4]);
// => [4, 1, 3, 2]

lodash.size([1, 2, 3]);
// => 3
 
lodash.size({ 'a': 1, 'b': 2 });
// => 2
 
lodash.size('pebbles');
// => 7

lodash.some([null, 0, 'yes', false], Boolean);
// => true
 
 users = [
  { 'user': 'barney', 'active': true },
  { 'user': 'fred',   'active': false }
];
 
// The `lodash.matches` iteratee shorthand.
lodash.some(users, { 'user': 'barney', 'active': false });
// => false
 
// The `lodash.matchesProperty` iteratee shorthand.
lodash.some(users, ['active', false]);
// => true
 
// The `lodash.property` iteratee shorthand.
lodash.some(users, 'active');
// => true

users = [
    { 'user': 'fred',   'age': 48 },
    { 'user': 'barney', 'age': 36 },
    { 'user': 'fred',   'age': 40 },
    { 'user': 'barney', 'age': 34 }
  ];
   
  lodash.sortBy(users, [function(o) { return o.user; }]);
  // => objects for [['barney', 36], ['barney', 34], ['fred', 48], ['fred', 40]]
   
  lodash.sortBy(users, ['user', 'age']);
  // => objects for [['barney', 34], ['barney', 36], ['fred', 40], ['fred', 48]]

  lodash.defer(function(stamp) {
    console.log(lodash.now() - stamp);
  }, lodash.now());
  // => Logs the number of milliseconds it took for the deferred invocation.

  var saves = ['profile', 'settings'];
 
var done = lodash.after(saves.length, function() {
  console.log('done saving!');
});
 


lodash.map(['6', '8', '10'], lodash.ary(parseInt, 1));
// => [6, 8, 10]

function greet(greeting, punctuation) {
    return greeting + ' ' + this.user + punctuation;
  }
   
  object = { 'user': 'fred' };
   
   bound = lodash.bind(greet, object, 'hi');
  bound('!');
  // => 'hi fred!'
   
  // Bound with placeholders.
   bound = lodash.bind(greet, object, lodash, '!');
  bound('hi');
  // => 'hi fred!'

   object = {
    'user': 'fred',
    'greet': function(greeting, punctuation) {
      return greeting + ' ' + this.user + punctuation;
    }
  };
   
   bound = lodash.bindKey(object, 'greet', 'hi');
  bound('!');
  // => 'hi fred!'
   
  object.greet = function(greeting, punctuation) {
    return greeting + 'ya ' + this.user + punctuation;
  };
   
  bound('!');
  // => 'hiya fred!'
   
  // Bound with placeholders.
  bound = lodash.bindKey(object, 'greet', lodash, '!');
  bound('hi');
  // => 'hiya fred!'

  var abc = function(a, b, c) {
    return [a, b, c];
  };
   
  curried = lodash.curry(abc);
   
  curried(1)(2)(3);
  // => [1, 2, 3]
   
  curried(1, 2)(3);
  // => [1, 2, 3]
   
  curried(1, 2, 3);
  // => [1, 2, 3]
   
 abc = function(a, b, c) {
  return [a, b, c];
};
 
 curried = lodash.curryRight(abc);
 
curried(3)(2)(1);
// => [1, 2, 3]
 
curried(2, 3)(1);
// => [1, 2, 3]
 
curried(1, 2, 3);
// => [1, 2, 3]
 
lodash.defer(function(text) {
    console.log(text);
  }, 'deferred');
  // => Logs 'deferred' after one millisecond.

  lodash.delay(function(text) {
    console.log(text);
  }, 1000, 'later');
  // => Logs 'later' after one second.


  var flipped = lodash.flip(function() {
    return lodash.toArray(arguments);
  });
   
  flipped('a', 'b', 'c', 'd');
  // => ['d', 'c', 'b', 'a']

object = { 'a': 1, 'b': 2 };
other = { 'c': 3, 'd': 4 };
 
values = lodash.memoize(lodash.values);
values(object);
// => [1, 2]
 
values(other);
// => [3, 4]
 
object.a = 2;
values(object);
// => [1, 2]
 
// Modify the result cache.
values.cache.set(object, ['a', 'b']);
values(object);
// => ['a', 'b']
 
// Replace `_.memoize.Cache`.
lodash.memoize.Cache = WeakMap;