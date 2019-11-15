//We declare the WeakMap to store our counters
let counter = new WeakMap();

let handler = {
  apply: function(target) {
  	//If undef then we define the counter : we just increase by 1
    counter.has(target) === true ? (counter.set(target, counter.get(target) + 1)) : counter.set(target, 1);
  	console.log(target.name, counter.get(target));
  	return Reflect.apply(...arguments);
  },
  get: function(target, name){
    if (typeof target[name] === 'number' || typeof target[name] === 'boolea') {
      //In order to save the variable with number => we store it inside of WeakMap as an {}
      let saveData={};
      if (counter.has(target) === true) { //Since we use target as the unique key there is no chance for duplicates
        saveData = counter.get(target);    //Each target is unique
        saveData[name] = saveData[name] ? (saveData[name] + 1) : 1;  
        counter.set(target, saveData);
      }else
      {
        saveData[name] = 1;
        counter.set(target, saveData);
      }
      console.log(name, saveData[name]);
    }
    else{
      counter.has(target[name]) === true ? (counter.set(target[name], counter.get(target[name]) + 1)) : counter.set(target[name], 1);
      console.log(name, counter.get(target[name]));
    }
    return Reflect.get(target, name);
  },
  set: function(target, name, value){
    //we need to get the counter in 2 diff ways -- one for type number and one for the rest
    let counter_val;       //diff structure in counter for number and the rest
    typeof target[name] === 'number' ? counter_val = counter.get(target)[name] : 
        counter_val = counter.get(target[name]);
    console.log(name, counter_val);
    return Reflect.set(target, name, value)
  }
};

//Returns the proxy obj we want
let wrap = function(obj) {
  for (k in obj) {
    if (typeof obj[k] === 'number') {
      obj[k] = obj[k];  //no action 
    }else if (obj[k] === 'object') {
      obj[k] = wrap(obj[k]);
    }else{
      obj[k] = new Proxy(obj[k], handler);
    }
  } 
  return obj;
} 


module.exports=wrap;

