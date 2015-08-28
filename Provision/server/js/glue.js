/*
  This is the glue component which would be responsible for offloading the execution to the cloudlet.
*/

var disconnected = -2;

// Try connecting to the cloudlet
function connectToCloudletServer(){
  cloudletIP = document.getElementById('cloudletIP').value;
   var manager = io.Manager(cloudletIP, {'reconnection' : false});
   manager.on('connect_error', function() {
     console.log("Connection error!");
   	 disconnected = -1;
     checkConnectionAndTransfer();
   });

  socket = io.connect(cloudletIP, {'reconnection':false});
  socket.on('connect', function(){
  	console.log("Connected to cloudlet");
  	disconnected = 0;
    checkConnectionAndTransfer();
  });

  socket.on('established', function(data){
    console.log('Start simulation');
    start();
  });

}

//check whether the connection is successful or not
function checkConnectionAndTransfer(){
  if(disconnected == -2){
    //nothing is known on the status of connection yet. Try again.
    setTimeout(checkConnectionAndTransfer, 50);
  }
  else {
    offload = disconnected == 0 ? true : false;
    console.log('Offloading: ' + offload);

    if(offload){
      console.log('Sending Files to Cloudlet')
      sendFilesToCloudletServer();
    }
    else{
      start();
    }
  }
}

function sendFilesToCloudletServer(){
  // Get file from the server
  var request = new XMLHttpRequest();
  var fileNames = getFilesToTransfer();
  var totalFiles = fileNames.length;
  var filesSent = 0;
  for(var i in fileNames){
      fileName = fileNames[i];
      request.open('GET', '/'+fileName, true);
      request.onreadystatechange = function() {
        if (request.readyState === 4 && request.status === 200) {
            console.log('GET successful for ' + fileName);
            if(request.responseText){
              var text = request.responseText;
              // make the file details
              fileDetails = {
                fileName : fileName,
                content : text
              }
              // emit to cloudlet
              socket.emit('newFile', {file : fileDetails});
              filesSent++;
              if(filesSent === totalFiles)
                socket.emit('finished',{run:document.getElementById('fileToRun').value});
            }
        }
        else {
            console.log('error');
        }
      };
      request.send();
  }
}

function getFilesToTransfer(){
  files = document.getElementById('filesToTransfer').value;
  return files.split(',');
}
