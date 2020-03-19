#!env node
const conf = require("./conf.js");
const http = require('http');
const fs = require('fs');

// ./client.js            -- reports global status
const help=`
./client.js <w>        -- reports on status of worker <w>
./client <w> <expr>    -- launches <expr> on <w>

Workers currently available:
  ${Object.keys(workers).map( (e) => e ).join('\n  ')}
`;

let get = (key, cb) => {
  http.get(`http://${server}/`, (res) => {
    res.setEncoding('utf8');
    let rawData = '';
    res.on('data', (chunk) => { rawData += chunk; });
    res.on('end', () => {
      cb(rawData);
    });
  }).on('error', (e) => {
    cb(`Got error: ${e.message}`);
  });
};

let generateHeader = (serverLoc, data, op) => {
  return {
    hostname: conf.SERVER_IP,
    port: conf.SERVER_PORT,
    path: '/',
    method: op || 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  }
}

let put = (key, json, cb) => {
  const req = http.request(generateHeader(key, json), (res) => {
    console.log(`statusCode: ${res.statusCode}`)

    res.on('data', (d) => {
      process.stdout.write(d)
    })
  })
  
  req.on('error', (error) => {
    cb(error)
  })
  
  req.end(json)
  //req.end() // TODO combine
}

let printAndExit = (msg) => {
  console.log(msg);
  process.exit(-1);
}

let checkArgs = (args) => {
  if (args.length === 3 && /help/.test(args[2])) {
    printAndExit(help);
  }
  if (args.length === 3 && !workers[args[2]]) {
    printAndExit(`${args[2]} does not exist in workers!`);
  }
}

checkArgs(process.argv)
if (process.argv.length < 3) {
    printAndExit(help);
} else if (process.argv.length === 3) {
  put(process.argv[2], job, console.log);
  get(process.argv[2], console.log)
} else {
  let program;
  if (process.argv[3] === "-f") {
    program = fs.readFileSync(process.argv[4], 'utf-8');
  } else {
    program = process.argv[3]
  }
  if (program.indexOf('\'')) {
    //FIXME Confirm it does not matter
    console.error('WARNING, program includes single quotes that might mess things up');
  }
  let job = JSON.stringify({ dt: checkDishToken(), program: program })
  console.log(job)
}
// checkDishToken()
// if (process.argv[1])
// if (process.arb
// get(/*construct url*/, console.log)
