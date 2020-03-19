#!env node

const conf = require('./conf.js');
const http = require('http');


const generateHeader = (data, op) => {
  return {
    hostname: conf.SERVER_IP,
    port: conf.SERVER_PORT,
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
    let rawData = '';

    res.on('data', (chunk) => {
      rawData += chunk;
    });

    res.on('end', () => {
      console.log('this is the result', JSON.parse(rawData));
    });
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
