 	 // merge sort using server side javascripting


 	var http = require('http');
 	var fs = require('fs');
 	var server = http.createServer(handler);

 	function handler(req, res) {
 		console.log('Connection successful');
 		fs.readFile(__dirname + '/client.html',
 			function(err, data) {
 				if (err) {
 					res.writeHead(500);
 					return res.end('Error loading index.html');
 				}
 				res.writeHead(200);
 				res.end(data);
 			});
 	}
 	server.listen(1234);
 	var io = require('socket.io').listen(server);

 	io.sockets.on('connection', function(socket) {

 		socket.on('noOfElements', function(data) {
 		   var noOfElements = data.number;
 			console.log("Number of Elements: " + noOfElements);
 			var start = new Date().getTime();
 			var result = sort(noOfElements);
 			var end = new Date().getTime();
 			var result = {
           // res: result,
            time: (end-start)/1000 			
 			};
         socket.emit('result', {'res' : result});
         console.log('Finished. Took ' + (end-start)/1000 + ' seconds');
 		});

 	});

 	function sort(noOfElements) {
 		var items = [];
 		var number = 0;
 		for (var i = 0; i < noOfElements; i++) {
 			number = Math.floor(Math.random() * (noOfElements - 1)) + 1;
 			items.push(number);
 		}
 		var to = [];
 		var start = new Date().getTime();
 		to = mergeSort(items);
 		var end = new Date().getTime();
 		return to;
 	};

 	function mergeSort(items) {
 		if (items.length < 2)
 			return items;

 		var middle = Math.floor(items.length / 2),
 			left = items.slice(0, middle),
 			right = items.slice(middle);

 		return merge(mergeSort(left), mergeSort(right));

 	};

 	function merge(left, right) {
 		var result = [],
 			leftIndex = 0,
 			rightIndex = 0;

 		while (leftIndex < left.length && rightIndex < right.length) {
 			if (left[leftIndex] < right[rightIndex])
 				result.push(left[leftIndex++]);
 			else {
 				result.push(right[rightIndex++]);
 			}
 		}
 		return result.concat(left.slice(leftIndex)).concat(right.slice(rightIndex));
 	};
