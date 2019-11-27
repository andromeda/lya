//We import and declare all the nessacary modules  
const Module = require('module');
const vm = require('vm');
const fs = require('fs');

//All the nessasary modules for swap
let original_warp = Module.wrap;
let original_require = Module.prototype.require;
let original_resolveFilename = Module._resolveFilename;
let original_run = vm.runInThisContext;

//We declare the variables
let global_proxy = {};
let variable_call = {};

//We store names as a lifo
let true_name = {};
let count = 0;

//Handlers of Proxies
//The handler of the functions
let handler= {
	apply: function (target) {
		let curr_name = true_name[count];
		if (variable_call[curr_name].hasOwnProperty(target.name) === false)	
			variable_call[curr_name][target.name] = 1;
		else variable_call[curr_name][target.name]++; 

		return Reflect.apply( ...arguments);	
	},
	get: function(target, name){
		let curr_name = true_name[count];
		if (variable_call[curr_name].hasOwnProperty(target.name) === false)	
			variable_call[curr_name][target.name] = 1;
		else variable_call[curr_name][target.name]++;
    return Reflect.get(target, name);
	}
}

//The handler of the imported libraries
let handler_exports= {
	apply: function (target) {
		truename = arguments[1].truename;
		if (variable_call[truename].hasOwnProperty(target.name) === false)	
			variable_call[truename][target.name] = 1;
		else variable_call[truename][target.name]++; 
		return Reflect.apply( ...arguments);
	}
}

//The handler of compiledWrapper
//We wrap the compiledWrapper code in a proxy so
//when it is called it will do this actions =>
let handler_addArg= {
	apply: function (target) {
		let local_require = arguments[2][1];	//We catch local require in order to wrap it
		local_require = new Proxy(local_require, handler);
		arguments[2][1] = local_require;	//We wrap require
		arguments[2][5] = global_proxy;		//We pass the global values with the proxies
		let result = Reflect.apply( ...arguments);

		return result;
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
   	 		obj[k] = new Proxy(obj[k], handler);
    	}
  	}

	return obj;
} 

//https://stackoverflow.com/questions/14962018/detecting-and-fixing-circular-references-in-javascript
//StackOverFlow <3 O(n) solution -- with WeakMap
function isCyclic(object) {
   const seenObjects = new WeakMap(); // use to keep track of which objects have been seen.

   function detectCycle(obj) {
      // If 'obj' is an actual object (i.e., has the form of '{}'), check
      // if it's been seen already.
      if (Object.prototype.toString.call(obj) == '[object Object]') {

         if (seenObjects.has(obj)) {
            return true;
         }

         // If 'obj' hasn't been seen, add it to 'seenObjects'.
         // Since 'obj' is used as a key, the value of 'seenObjects[obj]'
         // is irrelevent and can be set as literally anything you want. I 
         // just went with 'undefined'.
         seenObjects.set(obj, undefined);

         // Recurse through the object, looking for more circular references.
         for (var key in obj) {
            if (detectCycle(obj[key])) {
               return true;
            }
         }

      // If 'obj' is an array, check if any of it's elements are
      // an object that has been seen already.
      } else if (Array.isArray(obj)) {
         for (var i in obj) {
            if (detectCycle(obj[i])) {
               return true;
            }
         }
      }

      return false;
   }

   return detectCycle(object);
}

//Returns the proxy obj we want for the imports
let proxy_wrap_imports = function(obj, handler) {
  for (k in obj) {
    if (typeof obj[k] === 'number') {
      	obj[k] = obj[k];  //no action 
    }else if (typeof obj[k] === 'object') {
    	if (isCyclic(obj[k])){ //Fixes the circular references
    		obj[k] = obj[k];  //no action
    	} else{
    		obj[k].truename = true_name[count];
      		obj[k] = proxy_wrap_imports(obj[k], handler);
    	}
    }else{
    	try{
    		obj[k] = new Proxy(obj[k], handler);
    	}catch(TypeError){}
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
			final_decl = create_global(name, final_decl);
		}		
	}

	return final_decl;
}

//We declare the data on the same time to pass them inside wrapped function
let create_global = (name, final_decl) => {
	if (global[name] != undefined){
		global_proxy[name] = proxy_wrap(handler, global[name]);
		final_decl = 'let ' + name + ' = pr.' + name +';\n' + final_decl; 
	}

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

//We export the name of the curr module and pass proxy to the final function
vm.runInThisContext = function(code, options) {
  let code_to_run = original_run(code, options);
  count++;
  true_name[count] = get_name(options['filename']);
  variable_call[true_name[count]] = {};
  return new Proxy(code_to_run, handler_addArg)
}

//We wrap the result in the wrapper function
Module.prototype.require = (path) => {
	let result = original_require(path,this);
	if(result.truename === undefined ){
		result = proxy_wrap_imports(result, handler_exports);
		result.truename = true_name[count];
		if (count !=1) count--;	 
	}

	return result;
}

//We print all the results on the end of the program
process.on('exit', function() {
    console.log("---------------------");
    console.log(variable_call);
});