var assert = require("assert");
var periods = require("../periods")

assert.equal(periods.day(), 24 * 60 * 60 * 1000);
assert.equal(periods.day(5), 5 * 24 * 60 * 60 * 1000);
assert.equal(periods.days(), periods.days(1));
assert.equal(periods.day(), periods.days(1));
assert.equal(periods.day(), periods.days());

assert.equal(periods.monthRough(), periods.monthsRough());
assert.equal(periods.monthRough(5), periods.monthsRough(5));

// can be used in hof's (i.e real functions, not methods)
var week = periods.week;
var durations = [1,2,3];
var weekDurations = durations.map(week);
assert.deepEqual(weekDurations, [ 604800000, 1209600000, 1814400000 ]);
