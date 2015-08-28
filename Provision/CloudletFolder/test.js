/*
 This file would run the cloudlet server and save the files received from client.

 -- Do multi-client approach
 -- Do offloading
*/

var http = require('http');
var cluster = require('cluster');
var numCPUs = require('os').cpus().length;
var sticky = require('sticky-session');
var redis = require('socket.io-redis');

if(cluster.isMaster){
  console.log('Inside Master');
  // create the worker processes
  for (var i = 0; i < numCPUs ; i++){
    cluster.fork();
  }
}
else {
  // The worker code to be run is written inside
  // the sticky().
}

sticky(function(){
  // This code runs inside the workers.
  // The sticky-session balances connection between workers based on their ip.
  // So all the requests from the same client would go to the same worker.
  // If multiple browser windows are opened in the same client, all would be
  // redirected to the same worker.
  var io = require('socket.io')({transports:'websockets'});
  var server = http.createServer(function(req,res){
    res.end('socket.io');
  })
  io.listen(server);

  // The Redis server can also be used to store the socket state
  //io.adapter(redis({host:'localhost', port:6379}));

  console.log('Worker: '+cluster.worker.id);
    // when multiple workers are spawned, the client
    // cannot connect to the cloudlet.

    io.sockets.on('connection', function(socket){
      console.log('Socket connected. Worker ' + cluster.worker.id);

      socket.on('test', function(data){
        console.log('Received test event');
      });

    }); //end io.socket.on
    return server;
}).listen(1235, function(){
  console.log('Socket.io server is up ');
});
