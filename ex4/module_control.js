//We import and declare all the nessacary modules  
let Module = require('module');
const assert = require('assert');
const fs = require('fs');
let paramet={};
let better_compile;

//We read and store the Json File
let rawdata = fs.readFileSync('globals.json'); 
let json_data = JSON.parse(rawdata);  

//Modify the require function so it accepts a second argument
Module.prototype.require = (parameters) => {
	//We can pass as many args we want as an single object inside require
	let size = parameters.length;
	let path = Module.prototype.parameters(parameters, size);
	
	//Original functionality of require
	assert(path, 'missing path');
  	assert(typeof path === 'string', 'path must be a string');
  	return Module._load(path, this);
};

//We decompose the given parametres 
Module.prototype.parameters = (obj, size) => {
	for (var i = 1; i <size; i++) {
		//Nessasary to change the name a little because of conflict with global var
		let name = obj[i] + '!';
		paramet[name] = 1;
	}
	return obj[0];
}

//Change wrap using swap 
let original_warp = Module.wrap;
Module.wrap = (script) =>  {
	//We add the declarations on the top of the script
	script = script.replace('module.exports =',
		globals_decl.call() + ' \nmodule.exports =');
	return original_warp(script); 
}

//We need to add all the global variable declarations in the script 
let globals_decl = () => {
	let final_decl = ' ';
	for (let up_value in json_data) {
		let global_variables = json_data[up_value];
		for (let decl_name in global_variables){
			let name = global_variables[decl_name];
			if(paramet[ name + '!'] != 1)	final_decl = '\nlet ' + name + ' = null; '  + final_decl; 
		}		
	}
	return final_decl;
}