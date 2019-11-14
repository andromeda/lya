//we declare the global array of our counters
var counter = {}

var handler = {
  apply: function(target, prop, argList) {
    counter[target] = counter[target]? (counter[target] + 1) : 1;
  	console.log(target.name, counter[target]);
    //if undef then we define the counter : we just increase by 1
  	return Reflect.apply(...arguments);
  }
};


//The function we want to catch
var o = {
  add: (a, b) => a + b,
  sub: (a, b) => a - b,
  mul: (a, b) => a * b
}

//returns the proxy obj we want
function wrap(obj) {
  for (k in obj) {
    obj[k] = new Proxy(obj[k], handler); 
  }
  return obj;
}


//example
o = wrap(o)

o.add(o.add(1, 2), 3);
o.mul(o.mul(1, 2), 3);
