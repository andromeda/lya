//We initialize a counter
var counter=0;
let handler = {
  apply: function(target) {
  	//When we call the function require we just counter++
  	counter++;
  	console.log(target.name, counter);	
  	return Reflect.apply( ...arguments );
  }
}
require= new Proxy(require, handler);


//Examples
require('./math.js');
