#!env node

const http = require('http');
const conf = require('./conf.js');

// Here we are access the input dynamic analysis
const jsonObject = require('./dynamic.json');

http.createServer( (request, response) => {
  response.writeHead(200,{'Content-Type' : 'application/json'});
  request.on('data', function (data) {
    const query = (data).toString();
    console.log('This is the query: ', query);
    const accessPath = query.split(' -> ');
    response.write(JSON.stringify(getFuctions(accessPath)));
    response.end();
  });
}).listen(conf.SERVER_PORT);

const getFuctions = (accessPath) => {
  let funcRoad = jsonObject;
  let saveData = null;

  for (var i = 0; i < accessPath.length; i++) {
    const name = accessPath[i].toLowerCase();
    if (funcRoad[name] != undefined) {
      saveData = funcRoad[name];
      funcRoad = funcRoad[name];
    } else {
      saveData = undefined;
    }
  }

  if (saveData === undefined) {
    return null;
  } else {
    return saveData;
  }
};
