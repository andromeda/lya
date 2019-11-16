var counter=0;

let Module = require('module');
const assert = require('assert');

var _require = Module.prototype.require.toString();

_require = _require.replace('{',
  '{\n  console.log("Require has been called");');

var patchedrequire = eval( '(' + _require + ')'); 

Module.prototype.require = (path) => {
	return patchedrequire.call(this, path);
};
