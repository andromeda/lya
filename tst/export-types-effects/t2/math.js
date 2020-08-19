console.log('Require math.js');
module.exports = {
  add: (a, b) => {
    console.log('Add is called');
    return a + b;
  },
  sub: (a, b) => {
    global.timesAddCalled++;
    return a - b;
  },
  mult: (a, b) => {
    global.pizza = 12;
    return a * b;
  }
}
