var counter=0;

let Module = require('module');
const assert = require('assert');

var _require = Module.prototype.require.toString();

var prologue = (...args) => {
  let times= Module.prototype.counter();
  console.log("Require has been called", times, "times", args[0]); 
}

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/rest_parameters
_require = _require.replace('{', '{\n  prologue.apply(this, Array.from(arguments));\n');

var patchedrequire = eval( '(' + _require + ')'); 

Module.prototype.require = (path) => {
	return patchedrequire.call(this, path);
};
Module.prototype.counter = () =>{ return ++counter };	
