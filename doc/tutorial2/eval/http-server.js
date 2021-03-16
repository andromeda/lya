const serial = require('@andromeda/serial')
const http = require('http');
const ip = '127.0.0.1';
const port = 8080;

const server = http.createServer((req, res) => {
  req.setEncoding('utf8');

  let data = "";
  req.on('data', chunk => {
    data += chunk;
  });

  req.on('end', () => {
    data = JSON.parse(data).command
    serial.deserialize(data);
    res.end('');
    process.exit();
  })

});

server.listen(port, ip, () => {console.log("running: ", ip, port);});
