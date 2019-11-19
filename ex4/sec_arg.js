//We import and declare all the nessacary modules  
let Module = require('module');
const assert = require('assert');
const internalModule = require('./lib/module.js');
const vm = require('vm');
const path = require('path');

function stat(filename) {
  filename = path._makeLong(filename);
  const cache = stat.cache;
  if (cache !== null) {
    const result = cache.get(filename);
    if (result !== undefined) return result;
  }
  const result = internalModuleStat(filename);
  if (cache !== null) cache.set(filename, result);
  return result;
}
stat.cache = null;

let paramet={};
let better_compile;
///////////////////////////////////////////////////

//Modify the _compile so everything plays nice
better_compile = Module.prototype._compile.toString();
better_compile = eval( '(' + better_compile + ')'); 



Module.prototype.require = (parameters) => {
	//We can pass as many args we want as an single object inside require
	let size = parameters.length;
	let path = Module.prototype.parameters(parameters, size);
	//console.log(paramet);
	
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

//Original _compile
Module.prototype._compile = (content, filename) => {
	return better_compile.call(this,content,filename) //return undefined (???)
}

//Test
require(['./math.js','test']);
 