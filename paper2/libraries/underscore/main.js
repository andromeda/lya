lyaConfig = {
  SAVE_RESULTS: require("path").join(__dirname, "dynamic.json"),
  analysisCh: 12,
};
let lya = require("../../src/txfm.js");
require = lya.configRequire(require, lyaConfig);
const _ = require('underscore');

_.chain([1, 2, 3]).reverse().value();

var stooges = [{name: 'curly', age: 25}, {name: 'moe', age: 21}, {name: 'larry', age: 23}];
var youngest = _.chain(stooges)
  .sortBy(function(stooge){ return stooge.age; })
  .map(function(stooge){ return stooge.name + ' is ' + stooge.age; })
  .first()
  .value();

  var lyrics = [
    {line: 1, words: "I'm a lumberjack and I'm okay"},
    {line: 2, words: "I sleep all night and I work all day"},
    {line: 3, words: "He's a lumberjack and he's okay"},
    {line: 4, words: "He sleeps all night and he works all day"}
  ];
  


    _.map([1, 2, 3], function(n){ return n * 2; });
    _([1, 2, 3]).map(function(n){ return n * 2; });

    _.templateSettings = {
      interpolate: /\{\{(.+?)\}\}/g
    };
    
    var template = _.template("Hello {{ name }}!");
    template({name: "Mustache"});
    
    var compiled = _.template("<% print('Hello ' + epithet); %>");
compiled({epithet: "stooge"});

var compiled = _.template("hello: <%= name %>");
compiled({name: 'moe'});

var template = _.template("<b><%- value %></b>");
template({value: '<script>'});

_.now();

var object = {cheese: 'crumpets', stuff: function(){ return 'nonsense'; }};

_.result(object, 'cheese');

_.result(object, 'stuff');

_.result(object, 'meat', 'ham');

_.unescape('Curly, Larry &amp; Moe');

_.escape('Curly, Larry & Moe');

_.uniqueId('contact_');

_.random(0, 100);


var stooge = {name: 'moe'};
stooge === _.constant(stooge)();

var underscore = _.noConflict();

_.isNull(null);

_.isNull(undefined);

_.isNaN(NaN);

isNaN(undefined);

_.isNaN(undefined);

_.isSet(new Set());

_.isWeakMap(new WeakMap());
_.isMap(new Map());
_.isSymbol(Symbol());

try {
  throw new TypeError("Example");
} catch (o_O) {
  _.isError(o_O);
}

_.isRegExp(/moe/);

_.isDate(new Date());
_.isBoolean(null);

_.isFinite(-101);

_.isFinite(-Infinity);
_.isNumber(8.4 * 5);
_.isString("moe");

(function(){ return _.isArguments(arguments); })(1, 2, 3);

_.isArguments([1,2,3]);

_.isObject({});

_.isObject(1);

(function(){ return _.isArray(arguments); })();

_.isArray([1,2,3]);
_.isEmpty([1, 2, 3]);
_.isEmpty({});

var stooge = {name: 'moe', age: 32};

_.isMatch(stooge, {age: 32});
var stooge = {name: 'moe', luckyNumbers: [13, 27, 34]};

var clone  = {name: 'moe', luckyNumbers: [13, 27, 34]};

stooge == clone;

_.isEqual(stooge, clone);

var ready = _.matcher({selected: true, visible: true});
_.map([1, 2, 3], function(num){ return num * 3; });

_.map({one: 1, two: 2, three: 3}, function(num, key){ return num * 3; });

_.map([[1, 2], [3, 4]], _.first);
var sum = _.reduce([1, 2, 3], function(memo, num){ return memo + num; }, 0);
var list = [[0, 1], [2, 3], [4, 5]];
var flat = _.reduceRight(list, function(a, b) { return a.concat(b); }, []);
var even = _.find([1, 2, 3, 4, 5, 6], function(num){ return num % 2 == 0; });
var evens = _.filter([1, 2, 3, 4, 5, 6], function(num){ return num % 2 == 0; });
var odds = _.reject([1, 2, 3, 4, 5, 6], function(num){ return num % 2 == 0; });
_.every([2, 4, 5], function(num) { return num % 2 == 0; });
_.some([null, 0, 'yes', false]);
_.contains([1, 2, 3], 3);
_.invoke([[5, 1, 7], [3, 2, 1]], 'sort');

var stooges = [{name: 'moe', age: 40}, {name: 'larry', age: 50}, {name: 'curly', age: 60}];
_.pluck(stooges, 'name');

var stooges = [{name: 'moe', age: 40}, {name: 'larry', age: 50}, {name: 'curly', age: 60}];
_.max(stooges, function(stooge){ return stooge.age; });

var numbers = [10, 5, 100, 2, 1000];
_.min(numbers);

_.sortBy([1, 2, 3, 4, 5, 6], function(num){ return Math.sin(num); });


var stooges = [{name: 'moe', age: 40}, {name: 'larry', age: 50}, {name: 'curly', age: 60}];
_.sortBy(stooges, 'name');

_.groupBy([1.3, 2.1, 2.4], function(num){ return Math.floor(num); });

_.groupBy(['one', 'two', 'three'], 'length');

var stooges = [{name: 'moe', age: 40}, {name: 'larry', age: 50}, {name: 'curly', age: 60}];
_.indexBy(stooges, 'age');
_.countBy([1, 2, 3, 4, 5], function(num) {
  return num % 2 == 0 ? 'even': 'odd';
});
_.shuffle([1, 2, 3, 4, 5, 6]);

_.sample([1, 2, 3, 4, 5, 6]);

_.sample([1, 2, 3, 4, 5, 6], 3);

(function(){ return _.toArray(arguments).slice(1); })(1, 2, 3, 4);
_.size([1, 2, 3, 4, 5]);
_.size({one: 1, two: 2, three: 3});
_.partition([0, 1, 2, 3, 4, 5], true);

_.compact([0, 1, false, 2, '', 3]);

_.first([5, 4, 3, 2, 1]);
_.initial([5, 4, 3, 2, 1]);
_.last([5, 4, 3, 2, 1]);
_.rest([5, 4, 3, 2, 1]);
_.flatten([1, [2], [3, [[4]]]]);
_.without([1, 2, 1, 0, 3, 1, 4], 0, 1);
_.union([1, 2, 3], [101, 2, 1, 10], [2, 1]);
_.intersection([1, 2, 3], [101, 2, 1, 10], [2, 1]);
_.difference([1, 2, 3, 4, 5], [5, 2, 10]);
_.uniq([1, 2, 1, 4, 1, 3]);
_.zip(['moe', 'larry', 'curly'], [30, 40, 50], [true, false, false]);
_.unzip([["moe", 30, true], ["larry", 40, false], ["curly", 50, false]]);
_.object(['moe', 'larry', 'curly'], [30, 40, 50]);
var partners = _.chunk(_.shuffle("gaga"), 2);
_.indexOf([1, 2, 3], 2);
_.lastIndexOf([1, 2, 3, 1, 2, 3], 2);
_.sortedIndex([10, 20, 30, 40, 50], 35);
_.findIndex([4, 6, 8, 12], true);


var users = [{'id': 1, 'name': 'Bob', 'last': 'Brown'},
             {'id': 2, 'name': 'Ted', 'last': 'White'},
             {'id': 3, 'name': 'Frank', 'last': 'James'},
             {'id': 4, 'name': 'Ted', 'last': 'Jones'}];
_.findLastIndex(users, {
  name: 'Ted'
});

_.range(10);

var func = function(greeting){ return greeting + ': ' + this.name };
func = _.bind(func, {name: 'moe'}, 'hi');
func();

var buttonView = {
  label  : 'underscore',
  onClick: function(){ alert('clicked: ' + this.label); },
  onHover: function(){ console.log('hovering: ' + this.label); }
};
_.bindAll(buttonView, 'onClick', 'onHover');

var subtract = function(a, b) { return b - a; };
sub5 = _.partial(subtract, 5);
sub5(20);

var fibonacci = _.memoize(function(n) {
  return n < 2 ? n: fibonacci(n - 1) + fibonacci(n - 2);
});

var log = _.bind(console.log, console);
_.delay(log, 1000, 'logged later');

var hello = function(name) { return "hello: " + name; };
hello = _.wrap(hello, function(func) {
  return "before, " + func("moe") + ", after";
});
hello();

var isFalsy = _.negate(Boolean);
_.find([-2, -1, 0, 1, 2], isFalsy);

var greet    = function(name){ return "hi: " + name; };
var exclaim  = function(statement){ return statement.toUpperCase() + "!"; };
var welcome = _.compose(greet, exclaim);
welcome('moe')

_.keys({one: 1, two: 2, three: 3});
function Stooge(name) {
  this.name = name;
}
Stooge.prototype.silly = true;
_.allKeys(new Stooge("Moe"));

_.values({one: 1, two: 2, three: 3});

_.mapObject({start: 5, end: 12}, function(val, key) {
  return val + 5;
});

_.pairs({one: 1, two: 2, three: 3});
_.invert({Moe: "Moses", Larry: "Louis", Curly: "Jerome"});
var moe = _.create(Stooge.prototype, {name: "Moe"});
_.functions(_);
_.extend({name: 'moe'}, {age: 50});
_.pick({name: 'moe', age: 50, userid: 'moe1'}, 'name', 'age');
_.pick({name: 'moe', age: 50, userid: 'moe1'}, 'name', 'age');
var iceCream = {flavor: "chocolate"};
_.defaults(iceCream, {flavor: "vanilla", sprinkles: "lots"});
_.clone({name: 'moe'});
_.has({a: 1, b: 2, c: 3}, "b");


var stooge = {name: 'moe'};
'moe' === _.property('name')(stooge);
var stooge = {name: 'moe'};
_.propertyOf(stooge)('name');
