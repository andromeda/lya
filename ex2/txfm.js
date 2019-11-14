//we declare the global array of our counters
let counter = new WeakMap();

let handler = {
  apply: function(target, prop, argList) {
  	//if undef then we define the counter : we just increase by 1
    counter.has(target)===true ? (counter.set(target,counter.get(target) + 1)) : counter.set(target,1);
  	console.log(target.name, counter.get(target));
  	return Reflect.apply(...arguments);
  },
  get: function(target,name,argList){
    if (typeof target[name]==='function') {
      counter.has(target[name])===true ? (counter.set(target[name],counter.get(target[name]) + 1)) : counter.set(target[name],1);
      console.log(name, counter.get(target[name]));
    }  
    return Reflect.get(target,name);
  },
  set: function(obj, prop, value){
    console.log(prop, counter.get([obj[prop]]));
    return Reflect.set(obj,prop,value)
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

