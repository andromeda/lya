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
      variable_call[curr_name][target.name] = true;

    return Reflect.apply( ...arguments);  
  },
  get: function(target, name){
    let curr_name = true_name[count];
    if (variable_call[curr_name].hasOwnProperty(target.name) === false) 
      variable_call[curr_name][target.name] = true;

    return Reflect.get(target, name);
  }
}

//The handler of the imported libraries
let handler_exports= {
  apply: function (target) {
    let curr_name = arguments[1].truepath;
    let truename = arguments[1].truename;
    truename = truename + "." + target.name;
    if (variable_call[curr_name].hasOwnProperty(truename) === false)  
      variable_call[curr_name][truename] = true;
 
    return Reflect.apply( ...arguments);
  }
}

//The handler of require --we need to import the name
let handler_require= {
  apply: function (target) {
    let curr_name = true_name[count];
    let name_req = target.name + '(\''+ arguments[2][0] + "\')";  //In arguments[2][0] is the name we use to import    if (variable_call[curr_name].hasOwnProperty(name_req) === false) 
    variable_call[curr_name][name_req] = true;
    return Reflect.apply( ...arguments);  
  }
}

//The handler of compiledWrapper
//We wrap the compiledWrapper code in a proxy so
//when it is called it will do this actions =>
let handler_addArg= {
  apply: function (target) {
    let local_require = arguments[2][1];  //We catch local require in order to wrap it
    local_require = new Proxy(local_require, handler_require);
    arguments[2][1] = local_require;  //We wrap require
    arguments[2][5] = global_proxy;   //We pass the global values with the proxies
    let result = Reflect.apply( ...arguments);

    return result;
  } 
}

let handler_obj_export= {
  get: function(target, name){
    if(typeof target[name] != 'string' && typeof target[name] != 'undefined'){
      if (typeof target[name] === 'object') {
        let local_object = target[name];
        target[name] = new Proxy (local_object, handler_obj_export);
        target[name].truename = target['truename'] + '.' + name ;
        target[name].truepath = target['truepath'];
      }else{
        let local_function = target[name];
        target[name] = new Proxy(local_function, handler_exports)
      }
    }

    return Reflect.get(target, name);
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
    result = new Proxy (result, handler_obj_export);
    result.truename = 'require(\'' + path + '\')';
    result.truepath = true_name[count];
    if (count !=0) count--;  
  }else{
    result = new Proxy (result, handler_obj_export);
    result.truename = 'require(\'' + path + '\')';
    result.truepath = true_name[count];
  }
  return result;
}

//We print all the results on the end of the program
process.on('exit', function() {
    console.log(JSON.stringify(variable_call));
});

let exp_require = new Proxy (require, handler_require);
true_name[0] = 'main';
variable_call[true_name[0]] = {};
module.exports = exp_require;