const http=require('http');

// Here we are access the input dynamic analysis
const jsonObject = require('./dynamic.json');
let result;

const server=http.createServer((function(request, response)
{
	response.writeHead(200,{'Content-Type' : 'application/json'});
	console.log("Access");
	request.on('data', function (data) {
       		let query = (data).toString();
       		console.log('This is the query: ', query);

					const accessPath = query.split(' -> ');

					result = getFuctions(accessPath);

					response.write(JSON.stringify(result));
					response.end();
				});
}));
server.listen(7000);
console.log('The server is listening to the port 7000');


const getFuctions = (accessPath) => {
	let funcRoad = jsonObject;
	let saveData = null;

	for (var i = 0; i < accessPath.length; i++) {
		const name = accessPath[i].toLowerCase();
		if (funcRoad[name] != undefined) {
			saveData = funcRoad[name];
			funcRoad = funcRoad[name];
		}
	}

	if (saveData === undefined) {
		return {};
	} else {
		return saveData;
	}
};
