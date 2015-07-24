/*
 Test server code to test the nodejs ws library for performance. 
 Related client file is client_ws.html.

 Result: It is not fast enough. An array of 60000 numbers (~570KB) takes around
 110ms to reach the client running on the same machine.
 The time is end-to-end i.e. the server gets the stream, performs the computation, transmits the
 data to client, client receives it and decodes.
*/


 	var http = require('http');
 	var fs = require('fs');
 	var path = require('path');
 	var sizeof = require('object-sizeof');
 	var server = http.createServer(handler);
 	var msgpack = require('msgpack-js-browser');
    var WebSocket = require('ws').Server;

 	function handler(req, res) {
    	var filePath = __dirname + '/client_ws.html';

    	if(req.url == '/')
        	filePath = __dirname + '/client_ws.html';
    
    //console.log('Request URL :' + req.url);
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
            	filePath = __dirname + '/client_ws.html';
            	break;
    	}
    	//console.log('File Path :' + filePath);
    	if(req.url != '/favicon.ico'){
        	//console.log("not favicon")
        	fs.readFile(filePath, function(err, data) {
            	if (err) {
                	console.log(err);
                	res.writeHead(500);
                	return res.end('Error loading client.html');
            	}
            	console.log('Connection successful');
            	res.writeHead(200, {'Content-Type': contentType});
            	res.end(data, 'utf-8');
        	});
    	}

	};

	server.listen(1234);
 	var wss = new WebSocket({server : server});

 	//var io = require('socket.io').listen(server);

 	wss.on('connection', function(ws){
        ws.on('message', function incoming(message){
            emitTime = new Date();
            totalNumbers = message;
            numbers = [];
            console.log('Total numbers: ' + totalNumbers);
            for(i=0;i<totalNumbers;i++){
                array = [];
                for(j=0;j<6;j++){
                    n = 10000*(Math.random() * (0.120 - 0.020) + 0.020).toFixed(7);
                    array.push(n);
                }
                numbers.push(array);
            }            
            console.log('Event emitted at: ' + emitTime.getHours() + ':' + 
                emitTime.getMinutes() + ':' + emitTime.getSeconds() + ':' + emitTime.getMilliseconds());
            d = {
                t : emitTime.getTime(),
                n : numbers
            }
            encoded = msgpack.encode(d);
            console.log('Size of data in bytes: ' + encoded.byteLength);
            var buffer = new Buffer( new Uint8Array(encoded));
            //ws.send(buffer, { binary: true});
            ws.send(buffer);
        });
    });

