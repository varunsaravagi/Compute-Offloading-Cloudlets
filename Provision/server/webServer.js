/*
 This file would run the web server and server the required files to the
 client.
*/

var http = require('http');
var fs = require('fs');
var path = require('path');

var indexFile = '/index_compact.html';

console.log('----Web Server------');
function handler(req, res) {
   var filePath = __dirname + indexFile;

   if(req.url == '/')
       filePath = __dirname + indexFile;

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
           filePath = __dirname + indexFile;
           break;
   }
   //console.log('File Path :' + filePath);
   if(req.url != '/favicon.ico'){
       //console.log("not favicon")
       fs.readFile(filePath, function(err, data) {
           if (err) {
               console.log(err);
               res.writeHead(500);
               return res.end('Error loading ' + req.url);
           }
           res.writeHead(200, {'Content-Type': contentType});
           res.end(data, 'utf-8');
           console.log('-> Transferred ' + req.url);
       });
   }

};
var server = http.createServer(handler);
server.listen(1234);
var io = require('socket.io').listen(server);
