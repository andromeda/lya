//We import all the nessacary modules  
let Module = require('module');
const assert = require('assert');

let paramet={};

Module.prototype.require = (parameters) => {
	//We can pass as many args we want as an single object inside require
	let size = parameters.length;
	let path = Module.prototype.parameters(parameters, size);
	console.log(paramet);
	
	//Original functionality of require
	assert(path, 'missing path');
  	assert(typeof path === 'string', 'path must be a string');
  	return Module._load(path, this);
};

//We decompose the given parametres 
Module.prototype.parameters = (obj, size) => {
	for (var i = 1; i <size; i++) {
		paramet[i] = obj[i];
	}
	return obj[0];
}

var x = require(["./math.js", "console","setImmediate"]);
