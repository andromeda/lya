//we declare the global array of our counters
let counter = new WeakMap();
let counter_sec = {}; //necessary to declare because the WeakMap didnt accepted the name arg as key value from sec

let handler = {
  apply: function(target, prop, argList) {
  	//if undef then we define the counter : we just increase by 1
    counter.has(target)===true ? (counter.set(target,counter.get(target) + 1)) : counter.set(target,1);
  	console.log(target.name, counter.get(target));
  	return Reflect.apply(...arguments);
  },
  get: function(target,name,argList){
    //we solve the same key problem with this
    let key= JSON.stringify(target)+name; //every object now possesses a unique key

   	//if undef then we define the counter : we just increase by 1  
    counter_sec[key] = counter_sec[key]? (counter_sec[key] + 1) : 1;
    console.log(name, counter_sec[key]);
    return Reflect.get(target,name);
  }
};

//returns the proxy obj we want
let wrap = function(obj) {
  for (k in obj) {

    //no need for cases? -- it works like this
    obj[k] = new Proxy(obj[k], handler);
    } 	 
  return obj;
} 


module.exports=wrap;

