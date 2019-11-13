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


var wrapper= new Proxy(o,handler)

//examples
console.log(wrapper.add)
console.log(wrapper.add)
console.log(wrapper.add)
console.log(wrapper.add)

console.log(wrapper.sub)
console.log(wrapper.sub)
console.log(wrapper.sub)
console.log(wrapper.sub)

console.log(wrapper.mult)
console.log(wrapper.mult)
console.log(wrapper.mult)







