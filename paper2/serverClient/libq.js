#!/usr/bin/env node

const http = require('http');

const generateHeader = (data, op) => {
  return {
    hostname: 'localhost',
    port: 7000,
    path: '/',
    method: op || 'PUT',
    headers: {
      'Content-Type': 'text/plain',
      'Content-Length': data.length
    }
  }
};

let put = (data, cb) => {
  const req = http.request(generateHeader(data), (res) => {
    console.log(`statusCode: ${res.statusCode}`)

    res.on('data', (d) => {
      let result = JSON.parse(d)
      console.log('this is the result', result);

    })
  })

  req.on('error', (error) => {
    console.error(error)
  })
  
  req.write(data)
  req.end()
}

const printExit = () => {
  console.error('Give some input');
};

const getInputData = (input) => {
  if (input.length < 3) {
    printExit();
  } else if (input.length === 3) {
    put(input[2]);
  }
};
// TODO: input file? to ask
getInputData(process.argv);




