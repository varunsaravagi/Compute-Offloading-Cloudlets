 /* This file uses BinaryJS library to transmit data.
 It was written in the initial stages to comparet socket.io and binary js
 Corresponding client js : js/cloth_client_binary.js
 Corresponding html : index_binary.html
 -Obsolete as of now- 
 */

 var http = require('http');
 var fs = require('fs');
 var path = require('path');
 var server = http.createServer(handler);
 var msgpack = require('msgpack-js-browser');
 //var sizeof = require('object-sizeof');


 function handler(req, res) {
    var filePath = __dirname + '/index_binary.html';

    if(req.url == '/')
        filePath = __dirname + '/index_binary.html';

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
            filePath = __dirname + '/index_binary.html';
            break;
    }
    //console.log('File Path :' + filePath);
    if(req.url != '/favicon.ico'){
        //console.log("not favicon")
        fs.readFile(filePath, function(err, data) {
            if (err) {
              //  console.log(err);
                res.writeHead(500);
                return res.end('Error loading index.html');
            }
          //  console.log('Connection successful');
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
var displayed = false;

server.listen(1235);
var BinaryServer = require('binaryjs').BinaryServer;
var bs = new BinaryServer({server : server});

var id = 0;
bs.on('connection', function(client){
    client.on('stream', function(stream, meta){
        stream.on('data', function(data){
            rcvTime = new Date();
            param = new Uint8Array(data.buffer);
            decoded = msgpack.decode(param.buffer);
            //console.log(decoded.id);

            if(decoded.id == 'load_parameters'){
                //console.log(data);
                parameters = decoded.parameters;
                //console.log("Parameters received. Initializing cloth");
                boundsx = parameters.canvas_width - 1;
                boundsy = parameters.canvas_height - 1;
                sCloth = new SerializedCloth();
                cloth = new Cloth();

                toSend = {
                  time : rcvTime.getTime(),
                  cloth : sCloth.points
                }
                displayed = false;
                encoded = msgpack.encode(toSend);
                var buffer = new Buffer( new Uint8Array(encoded));
                stream.write({buffer : buffer});
            }

            else if(decoded.id == 'updateCloth'){

                //console.log('Received updateCloth from client after: ' + (new Date().getTime() - decoded.t))
                update();

                startTime = new Date().getTime();
                toSend = {
                  time : rcvTime.getTime(),
                  cloth : sCloth.points
                }
                encoded = msgpack.encode(toSend);
                if(!displayed){
                    console.log('Size of cloth: ' + encoded.byteLength);
                    displayed = true;
                }


                var buffer = new Buffer( new Uint8Array(encoded));

                // endTime = new Date().getTime();
                // console.log('Time taken to encode: ' + (endTime-startTime));

                // d = new Date();
                // t =  d.getHours() + ':'+ d.getMinutes() + ':' + d.getSeconds() + ':' + d.getMilliseconds();
                // console.log('Event streamed at: ' + t);
                stream.write({buffer : buffer});
            }
            else if(decoded.id == 'mouse'){
                mouse = decoded.mouse;
            }
            else if(decoded.id == 'dataPoints'){
              text = '\n\nBinary:\nEnd-to-end Latency: ' + decoded.elatency + '\n' +
                'FPS: ' + decoded.fps;
              name = decoded.name + '.txt';
              fs.appendFile(name, text, function(err){
                if(err)
                  throw err;
                console.log('File saved');
              });
            }
        });
    });
});

    function update(){

        now = new Date().getTime();
        id++;
        cloth.update();
        past = new Date().getTime();

        //console.log('Time taken for update: ' + (past - now));
        now = new Date().getTime();


        //console.log('------------------------');

        //console.log('Time taken to emit: ' + (new Date().getTime() - d.getTime()));
    };


var sizeof = function(data){

}

// Point data structure to pass to client

function create_point(point){
    var serializedPoint = [];
    serializedPoint[0] = point.x;
    serializedPoint[1] = point.y;
    j = 2;
    var i = point.constraints.length;
    while(i--){
        serializedPoint[j++] = point.constraints[i].p2.x;
        serializedPoint[j++] = point.constraints[i].p2.y;
    }
    return serializedPoint;
    //return new Buffer(serializedPoint.toString().concat(':'));
};

var SerializedCloth = function(){

    this.points = [];
};

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

        } else if (dist < parameters.mouse_cut) this.constraints = [];
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

    var p = this.points.length;
    // while(p--)
    //     sCloth.update(this.points[p], this.points[p].index);
};
