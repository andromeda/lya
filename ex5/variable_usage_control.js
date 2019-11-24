//We import and declare all the nessacary modules  
const Module = require('module');
const vm = require('vm');
const fs = require('fs');

//All the nessasary modules for swap
let original_warp = Module.wrap;
let original_comp = Module.prototype._compile;
let original_require = Module.prototype.require;
let original_resolveFilename= Module._resolveFilename;
let original_run = vm.runInThisContext;

//We declare the variables
let global_proxy={};
let variable_call = {};
let true_name;

//Handlers of Proxies
//We declare the handler for 
let handler= {
	apply: function (target) {
		if (variable_call[true_name].hasOwnProperty(target.name) === false)	
			variable_call[true_name][target.name] = 1;
		else variable_call[true_name][target.name]++; 
		return Reflect.apply( ...arguments);	
	},
	get: function(target, name){
		if (variable_call[true_name].hasOwnProperty(target.name) === false)	
			variable_call[true_name][target.name] = 1;
		else variable_call[true_name][target.name]++;
    	return Reflect.get(target, name);
	}
}

//We use it for the imported libraries
let handler_exports= {
	apply: function (target) {
		truename = arguments[1].truename;
		if (variable_call[truename].hasOwnProperty(target.name) === false)	
			variable_call[truename][target.name] = 1;
		else variable_call[truename][target.name]++; 
		return Reflect.apply( ...arguments);
	}
}

//We pass all the global values with the proxies 
let handler_addArg= {
	apply: function (target) {
		arguments[2][5] = global_proxy;
		return Reflect.apply( ...arguments);	 
	}	
}

//Returns the proxy obj we want
let proxy_wrap = function(handler,obj) {
	if (typeof obj === 'function') {
		obj = new Proxy(obj, handler);
		return obj;
	}

  	for (k in obj) {
  		let type = typeof obj[k];
    	if (type === 'number' ||  type === 'boolean' ) {
      		obj[k] = obj[k];  
    	}else if (type === 'object') {
    	  	obj[k] = proxy_wrap(obj[k]);
   	 	}else{
   	 		try{
   	 			obj[k] = new Proxy(obj[k], handler);
   	 		}catch 
   	 			(TypeError){}
    	}
  	} 
	return obj;
} 

//We read and store the data of the json file
let rawdata = fs.readFileSync('globals.json'); 
let json_data = JSON.parse(rawdata);  

//We need to add all the global variable declarations in the script 
let globals_decl = () => {
	let final_decl = ' ';
	for (let up_value in json_data) {
		let global_variables = json_data[up_value];
		for (let decl_name in global_variables){
			let name = global_variables[decl_name];
			final_decl = create_global(name,final_decl);
		}		
	}
	return final_decl;
}

//We declare the data on the same time to pass them inside wrapped function
let create_global = (name, final_decl) => {
	if (global[name] != undefined)
		global_proxy[name] = proxy_wrap(handler, global[name]);
		final_decl = 'let ' + name + ' = pr.' + name +';\n' + final_decl; 
	return final_decl;
}

//We do some stuff and then call original warp
Module.wrap = (script) => {
	script = globals_decl() +  script;
	let wrapped_script = original_warp(script);
	wrapped_script = wrapped_script.replace('__dirname)', '__dirname, pr)');
	return wrapped_script;
}

//Returns the last location of a path
let get_name = (way_file) => {
	let splited = way_file.split('/')
	return splited[splited.length - 1];
};

//Swap  

//We export the name of the curr module and pass proxy to the final function
vm.runInThisContext = function(code, options) {
  let code_to_run = original_run(code, options);
  true_name = get_name(options['filename']);
  variable_call[true_name] = {};
  return new Proxy(code_to_run, handler_addArg)
}

Module._resolveFilename = (request, parent, isMain) => {
	let filename = original_resolveFilename(request, parent, isMain);
	true_name = get_name(filename);
	return filename;
}

//We wrap the result in the wrapper function
Module.prototype.require = (path) => {
	let result = original_require(path,this);
	result = proxy_wrap(handler_exports, result);
	result.truename = true_name;
	return result;
}

//We print all the results on the end of the program
process.on('exit', function() {
    console.log("---------------------");
    console.log(variable_call)
});
