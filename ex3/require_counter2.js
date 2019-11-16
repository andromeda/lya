var counter=0;

let Module = require('module');
const assert = require('assert');

var _require = Module.prototype.require.toString();

_require = _require.replace('{',
  '{\n var times= Module.prototype.counter();\n console.log("Require has been called", times, "times"); \n ');

var patchedrequire = eval( '(' + _require + ')'); 

Module.prototype.require = (path) => {
	return patchedrequire.call(this, path);
};
Module.prototype.counter = () =>{ return ++counter };	


