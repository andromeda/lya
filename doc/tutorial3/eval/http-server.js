const serial = require('@andromeda/serial');
const http = require('http');
const ip = '127.0.0.1';
const arg = process.argv[2];
let port;

if (arg !== 'eval/http-server.js') {
  port = process.argv[2] ? process.argv[2] : 8000;
} else {
  port = 8000;
}

const server = http.createServer((req, res) => {
  req.setEncoding('utf8');

  let data = '';
  req.on('data', (chunk) => {
    data += chunk;
  });

  req.on('end', () => {
    data = JSON.parse(data).command;
    serial.dec(data);
    res.end('');
    process.exit();
  });
});

server.listen(port, ip, () => {
  console.log('running: ', ip, port);
});

server.on('error', (e) => {
});
