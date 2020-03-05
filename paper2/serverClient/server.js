const http=require('http');

// Here we are going to save the input json data
const jsonObject = JSON.stringify(require('./dynamic.json'));

const server=http.createServer((function(request,response)
{
	response.writeHead(200,{'Content-Type' : 'application/json'});
	console.log("Access");	
	request.on('data', function (data) {
       		let query = (data).toString();
       		console.log('haha', query);	
  	});
	


	// This is the way we are going to send back the query
	// if we return json
	//response.write(JSON.stringify({ now: new Date() }));
    response.end();		
}));
server.listen(7000);
console.log('The server is listening to the port 7000');
