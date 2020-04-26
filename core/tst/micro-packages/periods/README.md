# Periods

Defined time-periods constants for Javascript, in milliseconds. Exposed as functions to make mis-typing fail noisily, rather than manifesting as `NaN`s in your data.

```javascript
var periods = require("periods");

var twentyFourHoursLater = Date.now() + periods.day();

var week = periods.week;

var durations = [1,2,3];
var weekDurations = durations.map(week);
```

Works in browser too.

## Methods

Each method has a plural defined. e.g `seconds()`, `monthsRough()`

### `second(n = 1)`

n * 1000

### `minute(n = 1)`

n * 60 * second

### `hour(n = 1)`

n * 60 * minute

### `day(n = 1)`

n * 24 * hour

### `week(n = 1)`

n * 7 * day

### `monthRough(n = 1)`

n * 4.3 * week

### `yearRough(n = 1)`

n * 365.25 * day

