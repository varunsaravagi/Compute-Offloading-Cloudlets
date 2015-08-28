/* This file uses socket.io to store the points and transmit them over the server in a binary format.
Only an array of points is being sent over the network. The neighbours would be re-discovered at the client.

Serialization format:
A point contains 2 numbers:
  (x,y) coordinates of the point, only integers.
  The neighboring constraint position is encoded in x,y only.
  x -ve, y -ve No constraint
  x -ve, y +ve Left constraint only
  x +ve, y -ve Top constraint only
  x +ve, y +ve Both constraints

*/

var msgpack = require('msgpack-js-browser');
var fs = require('fs');
// var io = require('socket.io').listen(1236);
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

var exports = module.exports = {}

global.run = exports.run = function(socket){
  // listen for socket events
  //io.sockets.on('connection', function(socket){

     // received parameters from client.
     socket.on('load_parameters', function(data){

         load_parameters(data.parameters);
         displayed = false;
         console.log('Cloth length: ' + sCloth.points.length);
         // encode and send over the server
         var encoded = msgpack.encode(sCloth.points);
         console.log('Encoded: ' + encoded.byteLength);
         socket.emit('updatedCloth', {image: true, buffer : encoded})
     });

     //received update cloth event from client
     socket.on('updateCloth', function(data){
         var start = new Date().getTime();
         // update the cloth
         sCloth.points = [];
         cloth.update();
         // encode the simpler version of cloth
         var encoded = msgpack.encode(sCloth.points);
         // display the size of cloth. (display only once)
         if(!displayed){
             console.log('Size of Data: ' + encoded.byteLength);
             displayed = true;
         }

         // emit the updated cloth
         socket.emit('updatedCloth', {image: true, buffer : encoded});
     });

     // received mouse event from client
     socket.on('mouse', function(data){
         mouse = data.mouseData;
     });

     socket.on('disconnect', function(){
       console.log('Socket disconnected. Deleted file: ' + __filename);
       fs.unlinkSync(__filename);
     });
}

global.load_params = function(param){
  load_parameters(param)
}
function load_parameters(param){
  parameters = param;
  console.log('Parameters received: ' + parameters.physics_accuracy +' ' + parameters.cloth_height + ' ' + parameters.cloth_width);
  boundsx = parameters.canvas_width - 1;
  boundsy = parameters.canvas_height - 1;
  // initialize the cloth
  sCloth = new SerializedCloth();
  cloth = new Cloth();
}




//--------SIMULATION SPECIFIC FUNCTIONS---------------

function create_point(point){
  var x = Math.round(point.x),
      y = Math.round(point.y);
  var constraintType;
  if(point.topConstraint){ //there is a top constraint
    if (!point.leftConstraint){ //there is no left constraint
      y = -y;
    }
  }
  else { //there is no top constraint
    if (point.leftConstraint) //there is a left constraint
      x = -x;
    else { // there is no left constraint
      x = -x;
      y = -y;
    }
  }

  return [x,y];
}
// Point data structure to pass to client
var SerializedCloth = function(){
   this.points = [];
   /*
    points is a 1-D array containing
    all the points in the cloth.

    Each point has two coordinates:
       x, y
    The constraints are defined using the
    sign of x, y.
    --> -x, -y : No constraints
    --> -x, +y : Left constraint
    --> +x, -y : Top constraint
    --> +x, +y : Both constraints

    Each point in the cloth would be at
    position 2*index, 2*index + 1 in this
    array, where
    index -> index of point in original cloth
   */
};

// update the point at the index
SerializedCloth.prototype.update = function(point,index){
   // index is the position of the point in the original Cloth.
   // add the coordinates of the point in the serialized Cloth

   // Final Structure: [x0,y0,x1,y1,x2,y2,...........xn,yn]
   var coord = create_point(point);
   this.points[2*index] = coord[0]; //add x coordinate
   this.points[2*index + 1] = coord[1]; //add y coordinate
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
   var nx = this.x + ((this.x - this.px) * .99) + ((this.vx / 2) * delta);
   var ny = this.y + ((this.y - this.py) * .99) + ((this.vy / 2) * delta);

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

   var start_x = parameters.canvas_width / 2 - Math.floor(parameters.cloth_width * parameters.spacing / 2);
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
           sCloth.update(p,index);
       }
   }
};

// update the points in the cloth : COMPUTATION
Cloth.prototype.update = function () {
  //console.log('start update');
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
   //console.log('end update');
};

global.update = update;
function update() {
    cloth.update();
    return sCloth.points;
}
