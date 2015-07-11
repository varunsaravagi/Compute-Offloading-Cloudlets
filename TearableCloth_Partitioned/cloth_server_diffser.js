/* This file uses socket.io to store the points and transmit them over the server in a binary format.
Only an array of points is being sent over the network. The neighbours would be re-discovered at the client.
*/

var http = require('http');
var fs = require('fs');
var path = require('path');
var server = http.createServer(handler);
var msgpack = require('msgpack-js-browser');
require('./js/result_server.js');
require('./js/fps_server.js');

var indexFile = '/index_diffser.html';
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
               return res.end('Error loading index.html');
           }
           //console.log('Connection successful');
           res.writeHead(200, {'Content-Type': contentType});
           res.end(data, 'utf-8');
       });
   }

};


// Define a point and initialize certain properties
var Point = function (x, y, index) {
   this.x = x;
   this.y = y;
   this.px = x;
   this.py = y;
   this.vx = 0;
   this.vy = 0;
   this.pin_x = null;
   this.pin_y = null;
   this.index = index;
   this.constraints = [];
   this.topConstraint = false;
   this.leftConstraint = false;
};


// parameters required for simulation
var canvas,
   ctx,
   cloth,
   boundsx,
   boundsy,
   mouse = {
       down: false,
       button: 1,
       x: 0,
       y: 0,
       px: 0,
       py: 0
   },
   sCloth;

var parameters;
var displayed = false;

server.listen(1234);
var io = require('socket.io').listen(server);
var id = 0;
var past;
var result = new dataPoints();
var fps = new timer();
// listen for socket events
io.sockets.on('connection', function(socket){

   // received parameters from client.
   socket.on('load_parameters', function(data){
       parameters = data.parameters;
       boundsx = parameters.canvas_width - 1;
       boundsy = parameters.canvas_height - 1;
       // initialize the cloth
       sCloth = new SerializedCloth();
       cloth = new Cloth();
       displayed = false;
       // encode and send over the server
       encoded = msgpack.encode(sCloth.points);
       socket.emit('newCloth', {image: true, buffer : encoded})
       console.log('Reset');
        result.reset();
        clearInterval(average);
        average = setInterval(getAverage, 6000);
   });


   //received update cloth event from client
   socket.on('updateCloth', function(data){
       start = new Date().getTime();
       // update the cloth
       cloth.update();
       // encode the simpler version of cloth
       encoded = msgpack.encode(sCloth.points);
       //console.log('Time Taken: ' + (new Date().getTime() - start));
       // display the size of cloth. (display only once)
       if(!displayed){
           console.log('Size of Data: ' + encoded.byteLength);
           displayed = true;
       }

       // emit the updated cloth
       socket.emit('updatedCloth', {image: true, buffer : encoded});
       eteLatency = past ? (new Date().getTime() - past) : 0;
       fps.tick(new Date().getTime());
       lfps = fps.fps(); 
       result.add(eteLatency,lfps);
       past = new Date().getTime();
   });

   // received mouse event from client
   socket.on('mouse', function(data){
       mouse = data.mouseData;
   });

   // received data points from client. Store them in a file.
   socket.on('dataPoints', function(data){
     dataPoints = data.dataPoints;
     text = '\n\nSocket:\nEnd-to-end Latency: ' + dataPoints.elatency + '\n' +
       'FPS: ' + dataPoints.fps;
     name = dataPoints.name + '.txt';
     fs.appendFile(name, text, function(err){
       if(err)
         throw err;
       console.log('File saved');
     })
   });

}); // end io.sockets.on

function getAverage(){
  console.log('Getting average');
  res = result.average();
  console.log('Latency: ' + res[0] + ', FPS: ' + res[1]);
  // send the readngs to server when we have 10 readings
  if(result.getReadings() == 10){
    save();
  }
}

function save(){
  elatency = result.getSElatency();
  lfps = result.getSFps();
  fileName = 'P'+parameters.physics_accuracy+'_H'+parameters.cloth_height+'_W'+parameters.cloth_width + '.txt';
  text = '\n\nSocket:\nEnd-to-end Latency: ' + elatency + '\n' +
       'FPS: ' + lfps;
  fs.appendFile(fileName, text, function(err){
    if(err)
      throw err;
      console.log('File saved');
  });
}
// get average of the readings every 6 seconds
var average = setInterval(getAverage, 6000);
//--------SIMULATION SPECIFIC FUNCTIONS---------------

function create_point(point){

  var constraintType;
  if(point.topConstraint){
    if (point.leftConstraint)
      constraintType = 3;
    else {
      constraintType = 2;
    }
  }
  else {
    if (point.leftConstraint)
      constraintType = 1;
    else {
      constraintType = 0;
    }
  }

  coord = [point.x, point.y, constraintType];
  return coord;
}
// Point data structure to pass to client
var SerializedCloth = function(){
   this.points = [];
};

// update the point at the index
SerializedCloth.prototype.update = function(point, index){
   this.points[index] = create_point(point);
}

// Add update property to Point
Point.prototype.update = function (delta) {

   if (mouse.down) {

       var diff_x = this.x - mouse.x,
           diff_y = this.y - mouse.y,
           dist = Math.sqrt(diff_x * diff_x + diff_y * diff_y);

       if (mouse.button == 1) {

           if (dist < parameters.mouse_influence) {
               this.px = this.x - (mouse.x - mouse.px) * 1.8;
               this.py = this.y - (mouse.y - mouse.py) * 1.8;
           }

       } else if (dist < parameters.mouse_cut){
         this.constraints = [];
         this.topConstraint = false;
         this.leftConstraint = false;
       }
   }

   // add gravity in the y direction
   this.add_force(0, parameters.gravity);

   delta *= delta;
   nx = this.x + ((this.x - this.px) * .99) + ((this.vx / 2) * delta);
   ny = this.y + ((this.y - this.py) * .99) + ((this.vy / 2) * delta);

   this.px = this.x;
   this.py = this.y;

   this.x = nx;
   this.y = ny;

   this.vy = this.vx = 0

   sCloth.update(this, this.index);

};

// Resolve the constraints of the point with the attached points
Point.prototype.resolve_constraints = function () {

   // if the point is a top-row point, return
   if (this.pin_x != null && this.pin_y != null) {

       this.x = this.pin_x;
       this.y = this.pin_y;
       return;
   }

   // Get the number of constraints. Would be maximum 2
   var i = this.constraints.length;
   while (i--){
     this.constraints[i].resolve();
   }


   // if the point is going outside the boundary,
   // give it a position within the boundary.

   if (this.x > boundsx) {
       this.x = 2 * boundsx - this.x;

   } else if (this.x < 1) {
       this.x = 2 - this.x;
   }

   if (this.y > boundsy) {

       this.y = 2 * boundsy - this.y;

   } else if (this.y < 1) {

       this.y = 2 - this.y;
   }
};

// add the input point as a constraint to this point.
// A point is attached to atmost 2 points:
// one on its left and one immediately above it.
Point.prototype.attach = function (point) {

   this.constraints.push(
       new Constraint(this, point)
   );
};

// remove the given link from the point
Point.prototype.remove_constraint = function (lnk) {

   var i = this.constraints.length;
   while (i--){

     // if i==0, then this can be a top constraint or a left constraint,
     // depending on the position of the point or if there is no left constraint.
     if (this.constraints[i] == lnk) {
       this.constraints.splice(i, 1);
       if(i==1){
         // if i==1, then this is definitely a top constraint.
         this.topConstraint = false;
       }
       else{ //i == 0
         // there is a topConstraint
         // Two cases are possible. If there is a left constraint, then we
         // are removing the left constraint. If there is no left constraint,
         // then we are removing the top constraint.
         if(this.topConstraint){
           if(this.leftConstraint){
             this.leftConstraint = false;
           }
           else{
            this.topConstraint = false;
           }
         }
         else {
           // there is no top constraint. Then this is definitely a left constraint.
           this.leftConstraint = false;
         }
       }// end else
     }// end if this.constraints[i]
   }// end while
}; // end function

// add force on the point in both the x and y directions
Point.prototype.add_force = function (x, y) {

   this.vx += x;
   this.vy += y;
};

// Set the coordinates where the point is to be pinned
// Only applicable for the top row points of the cloth
Point.prototype.pin = function (pinx, piny) {
   this.pin_x = pinx;
   this.pin_y = piny;
};

var Constraint = function (p1, p2) {

   this.p1 = p1;
   this.p2 = p2;
   this.length = parameters.spacing;
};

// Resolve the constraint
Constraint.prototype.resolve = function () {

   // Get the new distance between the two points in the constraint
   var diff_x = this.p1.x - this.p2.x,
       diff_y = this.p1.y - this.p2.y,
       dist = Math.sqrt(diff_x * diff_x + diff_y * diff_y),
       //Get the difference from the length. No idea why this formula was used
       diff = (this.length - dist) / dist;

   // if distance between points is > tear distance, remove the constraint,
   // i.e detach the points
   if (dist > parameters.tear_distance)
       this.p1.remove_constraint(this);

   // calculate the amount by which positions are to be changed.
   var px = diff_x * diff * 0.5;
   var py = diff_y * diff * 0.5;

   // add the difference to first point
   this.p1.x += px;
   this.p1.y += py;
   // subtract the difference from second point
   this.p2.x -= px;
   this.p2.y -= py;
};

var Cloth = function () {

   // store all the points in the cloth
   this.points = [];

   var start_x = parameters.canvas_width / 2 - parameters.cloth_width * parameters.spacing / 2;
   var index;
   // generate point for every combination of (x,y)
   for (var y = 0; y <= parameters.cloth_height; y++) {

       for (var x = 0; x <= parameters.cloth_width; x++) {

           //Position of the point
           index = (y*(parameters.cloth_width+1)) + x;
           var p = new Point(start_x + x * parameters.spacing, parameters.start_y + y * parameters.spacing, index);

           // if it is not the first point in the row, attach it with the point just before it
           if (x != 0){
             p.attach(this.points[this.points.length - 1]);
             p.leftConstraint = true;
           }

           // if it is the first row, pin the point at the coordinate. This is to keep the cloth
           // attached from the top.
           y == 0 && p.pin(p.x, p.y);

           // if it is not the first row, attach the point to the point just above it in the matrix
           // |.|.|.|.|.|
           // |.|.|i|.|.|
           // |.|.|p|.|.|
           // attach p to i.
           if (y != 0){
             p.attach(this.points[x + (y - 1) * (parameters.cloth_width + 1)]);
             p.topConstraint = true;
           }

           this.points.push(p);
           sCloth.points.push(create_point(p));
       }
   }
};

// update the points in the cloth : COMPUTATION
Cloth.prototype.update = function () {

   var i = parameters.physics_accuracy;

   // Resolve the constraints for all the points physics_accuracy number of times
   while (i--) {
       var p = this.points.length;
       while (p--)
           this.points[p].resolve_constraints();
   }


   i = this.points.length;
   // update all the points by delta amount. Brings swaying motion to the cloth
   while (i--)
       this.points[i].update(.016);

};
