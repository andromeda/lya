;(function(exports) {

var second = getter('second', 1000);
var minute = getter('minute', 60 * second);
var hour = getter('hour', 60 * minute);
var day = getter('day', 24 * hour);
var week = getter('week', 7 * day);

getter('monthRough', 4.3 * week);
getter('yearRough', 365.25 * day);

function getter(name, value) {
  exports[name] = exports[pluraliseName(name)] = function(n) {
    return n == null ? value : n * value;
  };
  return value;
}

function pluraliseName(name) {
  if(/Rough/.test(name)) {
    return name.replace("Rough", "sRough");
  } else {
    return name + 's';
  }
}

})((function() {
  if(typeof module === "undefined") {
    window.periods = {};
    return periods;
  } else {
    return exports;
  }
})());
