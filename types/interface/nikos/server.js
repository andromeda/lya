#!env node

const http = require('http');
const conf = require("./conf.js");

let ask = (str) => {
  let resultList = [];
  console.log(str);
  // compute...
  return resultList;
}

http.createServer( (request, response) => {
    // PUT /control adds to the global timeseries
    let body = [];
    request.on('data', (chunk) => {
      body.push(chunk);
    }).on('end', () => {
      body = Buffer.concat(body).toString();
      console.log(body);
      response.end(JSON.stringify(ask(JSON.parse(body))));
    });
}).listen(conf.SERVER_PORT);
