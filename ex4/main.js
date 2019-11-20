require('./module_control.js')

//We import the math.js with all the nessasary 'tags'
var x= require(['./math.js','console','require','module','exports','__filename','__dirname']);
console.log(x.add(3,1));
 