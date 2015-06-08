
 	var http = require('http');
 	var fs = require('fs');
 	var path = require('path');
 	var server = http.createServer(handler);

 	function handler(req, res) {
 		var filePath = __dirname + '/index.html';

 		if(req.url == '/')
 			filePath = __dirname + '/index.html';
 		
 		console.log('Request URL :' + req.url);
 		var extName = path.extname(req.url);
 		var contentType = 'text/html';

 		switch(extName){
 			case '.js':
 				contentType = 'text/javascript';
 				filePath = __dirname + req.url;
 				break;
 			case '.css':
 				contentType = 'text/css';
 				filePath = __dirname + req.url;
 				break;
 			default:
 				contentType = 'text/html';
 				filePath = __dirname + '/index.html';
 				break;
 		}
 		console.log('File Path :' + filePath);
 		//fs.exists(filePath, function(exists){

 			//if(exists){
 				fs.readFile(filePath,
 					function(err, data) {
 						if (err) {
 							res.writeHead(500);
 							return res.end('Error loading index.html');
 						}
 						console.log('Connection successful');
 						res.writeHead(200, {'Content-Type': contentType});
 						res.end(data, 'utf-8');
 					});
 			//}
 			// else {
 			// 	res.writeHead(404);
 			// 	res.end();
 			// }
 		//});
 		
 	}
 	server.listen(1234);
 	var io = require('socket.io').listen(server);