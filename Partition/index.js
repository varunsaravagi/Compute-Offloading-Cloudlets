/*
 This is a simple webserver to serve the files to the client.
*/
 	var http = require('http');
 	var fs = require('fs');
 	var path = require('path');
 	var server = http.createServer(handler);

   function handler(req, res) {
      var filePath = __dirname + '/index.html';

      if(req.url == '/')
          filePath = __dirname + '/index.html';

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
              filePath = __dirname + '/index.html';
              break;
      }
      //console.log('File Path :' + filePath);
      if(req.url != '/favicon.ico'){
          //console.log("not favicon")
          fs.readFile(filePath, function(err, data) {
              if (err) {
                  console.log(err);
                  res.writeHead(500);
                  return res.end('Error loading index.html');
              }
              //console.log('Connection successful');
              res.writeHead(200, {'Content-Type': contentType});
              res.end(data, 'utf-8');
          });
      }

  };

  server.listen(1236);
 	var io = require('socket.io').listen(server);

  io.sockets.on('connection', function(socket){
    socket.on('dataPoints', function(data){
      dataPoints = data.dataPoints;
      text = '\n\nMobile:\nEnd-to-end Latency: ' + dataPoints.elatency + '\n' +
        'FPS: ' + dataPoints.fps;
      name = dataPoints.name + '.txt';
      fs.appendFile(name, text, function(err){
        if(err)
          throw err;
        console.log('File saved');
      })
    });
  })
