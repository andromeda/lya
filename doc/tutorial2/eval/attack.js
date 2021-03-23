const tiny = require('tiny-json-http');
const url = 'http://localhost:8080/data';

var data = "" + 
  "const os = require('os'); " +
  "const write = require('fs').writeFileSync; "+
  "const hostname = JSON.stringify(os.hostname())\n" +
  "write('./personal.data',hostname); "

data = {command: data}    
tiny.post({url, data}, (err, result) => {
  process.exit();
}) 

