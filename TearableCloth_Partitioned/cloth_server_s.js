 /* This file issues the update commands from the server at every 1000/60 ms. This is the timeout 
 interval set for the update function, it is not necessary that the update is happening at this
 rate only. The next update happens only when the current update has finished.

 The serialization mechanism uses typed array to represent the points and the constraint points.
 The performance is not good and the data being transmitted is also of the size of ~700KB.
 */


 var http = require('http');
 var fs = require('fs');
 var path = require('path');
 var server = http.createServer(handler);
 var msgpack = require('msgpack-js-browser');

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
            console.log('Connection successful');
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
};

// Point data structure to pass to client
var SerializedPoint = function (point){
    this.index = point.index;
    this.x = point.x;
    this.y = point.y;
    this.constraints = [];
    var i = point.constraints.length;
    while(i--){
        this.constraints[i] = {x: point.constraints[i].p2.x, y: point.constraints[i].p2.y};
    }
};

var SerializedCloth = function(){

    this.points = [];
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
    };

var parameters;
var sCloth;



server.listen(1234);
var io = require('socket.io').listen(server);

io.sockets.on('connection', function(socket){
    
    socket.on('load_parameters', function(data){
        parameters = data.parameters;
        //console.log("Parameters received. physics_accuracy = " + parameters.physics_accuracy);
        sCloth = new SerializedCloth();
        cloth = new Cloth();
        console.log('Cloth length: ' + cloth.points.length)
        console.log('Serialized Cloth length: ' + sCloth.points.length)
        update(socket);
    });
}); // end io.sockets.on


SerializedPoint.prototype.update = function(point){
    this.x = point.x;
    this.y = point.y;

    this.constraints = [];
    var i = point.constraints.length;
    while(i--){
        this.constraints[i] = {x: point.constraints[i].p2.x, y: point.constraints[i].p2.y};
    }
}

SerializedCloth.prototype.update = function(point, index){
    this.points[index].update(point);
}

// Add update property to Point
Point.prototype.update = function (delta) {

    if (mouse.down) {

        var diff_x = this.x - mouse.x,
            diff_y = this.y - mouse.y,
            dist = Math.sqrt(diff_x * diff_x + diff_y * diff_y);

        if (mouse.button == 1) {

            if (dist < mouse_influence) {
                this.px = this.x - (mouse.x - mouse.px) * 1.8;
                this.py = this.y - (mouse.y - mouse.py) * 1.8;
            }

        } else if (dist < mouse_cut) this.constraints = [];
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

    sCloth.points[this.index].update(this);

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
    while (i--) 
        this.constraints[i].resolve();

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
    while (i--)
        if (this.constraints[i] == lnk) this.constraints.splice(i, 1);
};

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
            x != 0 && p.attach(this.points[this.points.length - 1]);
            
            // if it is the first row, pin the point at the coordinate. This is to keep the cloth
            // attached from the top.
            y == 0 && p.pin(p.x, p.y);
            
            // if it is not the first row, attach the point to the point just above it in the matrix
            // |.|.|.|.|.|
            // |.|.|i|.|.|
            // |.|.|p|.|.|
            // attach p to i.
            y != 0 && p.attach(this.points[x + (y - 1) * (parameters.cloth_width + 1)])

            this.points.push(p);
            sCloth.points.push(new SerializedPoint(p));
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
    var p = this.points.length;
    // while(p--)
    //     sCloth.update(this.points[p], this.points[p].index);
};


var id = 0;
var past = 0, now = 0;
function update(socket) {
    console.log('------------------------');
    now = new Date().getTime();
    id++;
    cloth.update();
    past = new Date().getTime();
    console.log('Time taken for update: ' + (past - now));
    now = new Date().getTime();
            //var encoded = msgpack.encode(sCloth);
            //console.log('Time taken to serialize: ' + (new Date().getTime() - now));
    d = new Date();
    var data = {
        cloth : sCloth,
        id : id,
        t : d.getTime()
    };
    console.log('Id: ' + id + ', Event emitted at: ' + d.getHours() +':'+
    d.getMinutes() + ':' + d.getSeconds() + ':' + d.getMilliseconds());
    socket.emit('updatedCloth', {param : data});
    setTimeout(update, 1000/60, socket);    
}
