const http = require('http');

const data = 'Number -> Number -> Number';

const options = {
  hostname: 'localhost',
  port: 7000,
  path: '/',
  method: 'POST',
  headers: {
    'Content-Type': 'text/plain',
  }
}

const req = http.request(options, (res) => {
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
