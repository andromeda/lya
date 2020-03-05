const http = require('http');

const data = 'this is the input';

const options = {
  hostname: 'localhost',
  port: 7000,
  path: '/',
  method: 'POST',
  headers: {
    'Content-Type': 'text/plain',
    //'Content-Length': data.length
  }
}

const req = http.request(options, (res) => {
  console.log(`statusCode: ${res.statusCode}`)

  res.on('data', (d) => {
    process.stdout.write(d)
  })
})

req.on('error', (error) => {
  console.error(error)
})

req.write(data)
req.end()

