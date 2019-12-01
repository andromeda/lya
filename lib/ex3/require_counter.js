//We import the module that stores the require function 
let Module = require('module');
const assert = require('assert');

//We declare the counter of require
let counter = 0;

//We just increace a counter and then call the original require
Module.prototype.require = (name) => {
	counter++;
	console.log("Require has been called", counter);

	//Original functionality of require
	assert(name, 'missing path');
  	assert(typeof name === 'string', 'path must be a string');
  	return Module._load(name, this);
};







