// This is going to be given by user
const importName = 'lodash';
const myExports = require(importName);
const allkeys = Object.keys(myExports);

for (var key in allkeys) {
  const name = allkeys[key];
  
  if (typeof myExports[name] === 'function') {
 
    var funcString = myExports[name].toString();
    var firstLine  = funcString.split('\n')[0];
    
    console.log('Function to write: ', name);
    console.log(firstLine);
    // With a simple RegExpr now we can get the inputs
  }
};
