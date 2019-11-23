//We import and declare all the nessacary modules  
const Module = require('module');
const vm = require('vm');

let original_warp = Module.wrap;
let original_comp = Module.prototype._compile;
const fs = require('fs');
let global_proxy={};

//We declare the variables
let variable_call = {};

//We declare the proxy
let handler= {
	apply: function (target) {
		if (variable_call[true_name].hasOwnProperty(target.name) === false)	
			variable_call[true_name][target.name]= 1;
		else variable_call[true_name][target.name]++; 
		return Reflect.apply( ...arguments);	
	},
	get: function(target, name){
		if (variable_call[true_name].hasOwnProperty(target.name) === false)	
			variable_call[true_name][target.name]= 1;
		else variable_call[true_name][target.name]++;
    	return Reflect.get(target, name);
	},
  	set: function(target, name, value){
  		savethings = target.name ;
  		return Reflect.set(target, name, value);
  	},
	getPrototypeOf: function(target) {
    return Reflect.getPrototypeOf(target);
  }
}

//We pass all the global values with the proxies 
let handler_addArg= {
	apply: function (target) {
		arguments[2][5]=global_proxy;
		return Reflect.apply(...arguments);
	}
}

//Returns the proxy obj we want
let proxy_wrap = function(obj) {
	if (typeof obj === 'function') {
		obj = new Proxy(obj, handler);
		return obj;
	}
  	for (k in obj) {
  		let type = typeof obj[k];
    	if (type === 'number' ||  type === 'boolean' ) {
      		obj[k] = obj[k];  //no action 
    	}else if (type === 'object') {
    	  	obj[k] = proxy_wrap(obj[k]);
   	 	}else{
      		obj[k] = new Proxy(obj[k], handler);
    	}
  	} 
	return obj;
} 


//We read and store the Json File
let rawdata = fs.readFileSync('globals.json'); 
let json_data = JSON.parse(rawdata);  


//We need to add all the global variable declarations in the script 
let globals_decl = () => {
	let final_decl = ' ';
	for (let up_value in json_data) {
		let global_variables = json_data[up_value];
		for (let decl_name in global_variables){
			let name = global_variables[decl_name];
			final_decl= create_global(name,final_decl);
		}		
	}
	return final_decl;
}

//We declare the data on the same time to pass them inside wrapped function
let create_global = (name, final_decl) => {
	if (global[name] != undefined)
		global_proxy[name] = proxy_wrap(global[name]);
		final_decl = 'let ' + name + ' = pr.' + name +';\n' + final_decl; 
	return final_decl;
}


//We do some stuff and then call original warp
Module.wrap = (script) => {
	script = globals_decl() +  script;
	let wrapped_script= original_warp(script);
	wrapped_script = wrapped_script.replace('__dirname)','__dirname, pr)');
	return wrapped_script;
}

//Returns the last location of a path
let get_name = (way_file) => {
	let splited = way_file.split('/')
	return splited[splited.length - 1];
};

//Swap  
let original_run = vm.runInThisContext;
let true_name;

//We export the name of the curr module and pass proxy to the final function
vm.runInThisContext = function(code, options) {
  let code_to_run = original_run(code, options);
  true_name = get_name(options['filename']);
  variable_call[true_name] = {};
  return new Proxy(code_to_run, handler_addArg)
}

//But in case we loaded the module and it is in cache and call it again we need it to re-import the name
let original_updateChildren= Module.updateChildren;
Module.updateChildren = (parent, child, scan) => {
	return original_updateChildren(parent,child,scan);
}

//We print all the results 
process.on('exit', function() {
    console.log("Caught exit signal");
    console.log(variable_call)
});

