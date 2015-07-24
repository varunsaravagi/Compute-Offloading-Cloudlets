/*
 Test server code to test the nodejs BinaryJs library for performance.

 Result: Not Good enough given that it takes around 70 ms to transmit around 570KB of data.
 The time is end-to-end i.e. the server gets the stream, performs the computation, transmits the
 data to client, client receives it and decodes.
*/

 	var http = require('http');
 	var fs = require('fs');
 	var path = require('path');
 	var sizeof = require('object-sizeof');
 	var server = http.createServer(handler);
 	var msgpack = require('msgpack-js-browser');

 	function handler(req, res) {
    	var filePath = __dirname + '/client.html';

    	if(req.url == '/')
        	filePath = __dirname + '/client.html';
    
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
            	filePath = __dirname + '/client.html';
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
 	
 	var BinaryServer = require('binaryjs').BinaryServer;
 	var bs = new BinaryServer({server : server});

 	//var io = require('socket.io').listen(server);

 	bs.on('connection', function(client){
 		client.on('stream', function(stream,meta){
 			console.log('server received stream ' + meta);
 			switch(meta){
 				case 'size':
 					var totalNumbers = 0;
 					stream.on('data', function(data){
 						emitTime = new Date();
 						console.log('inside stream.on');

 						totalNumbers = data;
	 					numbers = [];
	 					console.log(totalNumbers);
	 					for(i=0;i<totalNumbers;i++){
	 						array = [];
	 						for(j=0;j<6;j++){
	 							n = 10000*(Math.random() * (0.120 - 0.020) + 0.020).toFixed(7);
	 							array.push(n);
	 						}
	 						numbers.push(array);
	 					}
	 					console.log(numbers.length);	 					
	 					d = {
	 				       	t : emitTime.getTime(),
	 				        n : numbers
	 				    }
	 				    encoded = msgpack.encode(d);
	 				    console.log('Size of data in bytes: ' + encoded.byteLength);
	 				    console.log('Time taken to encode: ' + (new Date().getTime() - emitTime));
	 				    var buffer = new Buffer( new Uint8Array(encoded));
	 				    
	 				    emitTime = new Date();	 					
	 				    console.log('Event emitted at: ' + emitTime.getHours() + ':' +
		 				emitTime.getMinutes() + ':' + emitTime.getSeconds() + ':' + emitTime.getMilliseconds());
					    
	 				    stream.write({no : buffer});	

	 				});
	 					//totalNumbers = meta.data;
	 					
	 			break;
	 		}
 			
 		});
	});


 	// io.sockets.on('connection', function(socket) {

 	// 	socket.on('start', function(data){
 	// 		totalNumbers = data.size;
 	// 		numbers = [];
 	// 		console.log(totalNumbers);
 	// 		for(i=0;i<totalNumbers;i++){
 	// 			array = [];
 	// 			for(j=0;j<6;j++){
 	// 				n = 10000*(Math.random() * (0.120 - 0.020) + 0.020).toFixed(7);
 	// 				array.push(n);
 	// 			}
 	// 			numbers.push(n);
 	// 		}
 	// 		console.log(numbers.length);
 	// 		emitTime = new Date();
 	// 		//g = JSON.stringify(numbers); //stringify and remove all "stringification" extra data
 	// 		console.log('size of data using JSON: ' + JSON.stringify(numbers).length);
 	// 		console.log('Event emitted at: ' + emitTime.getHours() + ':' +
  //           emitTime.getMinutes() + ':' + emitTime.getSeconds() + ':' + emitTime.getMilliseconds());

  //           d = {
  //           	t : emitTime.getTime(),
  //           	n : numbers
  //           }
 	// 		socket.emit('send', {params : d});

 	// 	});
 	// });
