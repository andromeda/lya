//we declare the global array of our counters
var counter=new Array;

//if undef then we define the counter : we just increase by 1
var handler = {
  get: function(target,prop) {
  	console.log(prop)
  	return (typeof counter[prop] === "undefined") ? counter[prop]=1  :  (counter[prop]=counter[prop]+1);
  }
};


//The function we want to catch
var o = {
  add: (a, b) => a + b,
  sub: (a, b) => a - b,
  mult: (a,b) => a *b
}

//returns the proxy obj we want
function wrap(obj) {
	return new Proxy(obj,handler)
}


//example
o=wrap(o)

console.log(o.add)
console.log(o.add)
console.log(o.add)
console.log(o.add)

console.log(o.sub)
console.log(o.sub)
console.log(o.sub)
console.log(o.sub)

console.log(o.mult)
console.log(o.mult)
console.log(o.mult)
console.log(o.mult)







