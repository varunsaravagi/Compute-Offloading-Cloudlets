//--- based on tutorial at http://danielnill.com/nodejs-tutorial-with-socketio/ ---//

var http = require('http');
var fs = require('fs');
var server = http.createServer(handler);

function handler(req, res) {
   console.log('Connection successful');
	fs.readFile(__dirname + '/client.html',
	function (err, data) {
		if(err) {
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
   
   //setInterval(function () {
     // socket.emit('date', {'date': new Date()});   
   //}, 1000);
   
   socket.on('client_data', function(data){  
      process.stdout.write(data.letter);
      socket.emit('server_data', {'letter': data.letter.toUpperCase()});   
   });
   
   socket.on('position', function(data) {   
      console.log('X: ' + data.pos._x + ', Y: ' + data.pos._y);
      var _position = {
         _x : data.pos._x + 10,
         _y : data.pos._y + 10      
      };
      socket.emit('server_pos', {'_position': _position});   
   });
});