/*
 This file would run the cloudlet server and save the files received from client.
 This spawns the number of workers equal to the number of CPUs in the machine.
 Each worker is responsible for handling request originating from same ip address.

*/

var http = require('http');
var fs = require('fs');
var cluster = require('cluster');
var path = require('path');
var glob = require('glob');
var numCPUs = require('os').cpus().length;
var sticky = require('sticky-session');
var append = "_tmp_";
var redis = require('socket.io-redis');

if(cluster.isMaster){
  console.log('Inside Master');
  for (var i = 0; i < numCPUs ; i++){
    cluster.fork();
  }
}
else {
  // The worker code to be run is written Inside
  // the sticky code.
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

  // The Redis server can be used in case the application is data-intensive.
  // For current application, it is not necessary
  //io.adapter(redis({host:'localhost', port:6379}));
  console.log('Worker: '+cluster.worker.id);
    // when multiple workers are spawned, the client
    // cannot connect to the cloudlet.

    io.sockets.on('connection', function(socket){
      console.log('Cloudlet: Socket connected. Worker ' + cluster.worker.id);

      socket.on('newFile', function(data){
        console.log('----New File Received----');
        file = data.file;
        fileName = file.fileName;
        console.log('File name: ' + fileName);
        content = file.content;
        // create a new file.
        fileName = getNewName(fileName);
        fs.writeFile(fileName, content, function(err){
          if(err)
            throw err;
          console.log('File ' + fileName + ' saved');
        });
      });

      socket.on('finished', function(data){
        console.log('----Received All files----');
        socket.emit('established');
        fileRun = getFileToRun(data.run);
        console.log('File to run ' + fileRun);
        var process = require('./'+ fileRun);
        process.run(socket);
      });
    }); //end io.socket.on
    return server;
}).listen(1235, function(){
  console.log('Socket.io server on ');
});

function getNewName(fileName){
    // find all the files in the directory containing the given fileName
    files = helperGetAllFiles(fileName);

    var extName = path.extname(fileName);
    fileName = fileName.substr(0, fileName.lastIndexOf('.')) || fileName;

    var noOfFiles = files.length;
    if(noOfFiles === 0){
      name = fileName + append + '1' + extName;
      console.log('File obtained for the first time. File name: ' + name);
      return name;
    }
    name = fileName + append + (helperGetMaxFileNumber(files)+1) + extName;
    console.log('File exists already. New file name is ' + name);
    return name;
}

function getFileToRun(fileName){
  files = helperGetAllFiles(fileName);
  var extName = path.extname(fileName);
  fileName = fileName.substr(0, fileName.lastIndexOf('.')) || fileName;
  return fileName + append + helperGetMaxFileNumber(files) + extName;
}

function helperGetAllFiles(fileName){
  var extName = path.extname(fileName);
  fileName = fileName.substr(0, fileName.lastIndexOf('.')) || fileName;
  var pattern = fileName+'*'+extName;
  return glob.sync(pattern);
}

function helperGetMaxFileNumber(files){
  var nos = files.map(function(file){
    //file is of name fileName + append + someNumber + .js
    //splitting the file on append would give two substrings. Get the
    //number from the second substring
    return parseInt(file.split(append)[1].split('.'));
  });
  // sort the nos in descending order and get the maximum number.
  // the new file would have maximum+1 number in it
  nos.sort(function(a,b){
    return b-a;
  });
  return nos[0];
}
