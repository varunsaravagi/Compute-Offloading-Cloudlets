
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
 			console.log('Connection successful');
 			res.writeHead(200, {'Content-Type': contentType});
			res.end(data, 'utf-8');
		});
 	}

};


server.listen(1234);
var io = require('socket.io').listen(server);
// Functions to run on the server side
var parameters;
var cloth = {
    points: []

};

io.sockets.on('connection', function(socket){
	
	socket.on('load_parameters', function(data){
		parameters = data.parameters;
		console.log("Parameters received. physics_accuracy = " + parameters.physics_accuracy);
	});

    socket.on('update_cloth', function(data){
        cloth.points.push(data.point);
        //var cloth = data.cloth;
        //console.log('hello');
        //console.log(data.cloth.x);
    });

}); // end io.sockets.on

// Add update property to Point
function update_point(point, delta) {

    if (mouse.down) {

        var diff_x = point.x - mouse.x,
            diff_y = point.y - mouse.y,
            dist = Math.sqrt(diff_x * diff_x + diff_y * diff_y);

        if (mouse.button == 1) {

            if (dist < mouse_influence) {
                point.px = point.x - (mouse.x - mouse.px) * 1.8;
                point.py = point.y - (mouse.y - mouse.py) * 1.8;
            }

        } else if (dist < mouse_cut) point.constraints = [];
    }

    // add gravity in the y direction
    point = add_force(0, gravity);

    delta *= delta;
    nx = point.x + ((point.x - point.px) * .99) + ((point.vx / 2) * delta);
    ny = point.y + ((point.y - point.py) * .99) + ((point.vy / 2) * delta);

    point.px = point.x;
    point.py = point.y;

    point.x = nx;
    point.y = ny;

    point.vy = point.vx = 0

    return point;
};


function add_force(point, x, y){
	point.vx += x;
	point.vy += y;
	return point;
}

function resolve_point_constraints(point){

    // if the point is a top-row point, return
    if (point.pin_x != null && point.pin_y != null) {

        point.x = point.pin_x;
        point.y = point.pin_y;
        return;
    }

    // Get the number of constraints. Would be maximum 2
    var i = point.constraints.length;
    while (i--) 
    	point.contraints[i] = resolve_constraint(point.contraints[i]);

    // if the point is going outside the boundary, 
    // give it a position within the boundary.

    if (point.x > boundsx) {
        point.x = 2 * boundsx - point.x;
        
    } else if (point.x < 1) {
        point.x = 2 - point.x;
    }

    if (point.y > boundsy) {

        point.y = 2 * boundsy - point.y;
        
    } else if (point.y < 1) {

        point.y = 2 - point.y;
    }
}

// Resolve the constraint
function resolve_constraint(constraint) {

    // Get the new distance between the two points in the constraint
    var diff_x = constraint.p1.x - constraint.p2.x,
        diff_y = constraint.p1.y - constraint.p2.y,
        dist = Math.sqrt(diff_x * diff_x + diff_y * diff_y),
        //Get the difference from the length. No idea why this formula was used
        diff = (constraint.length - dist) / dist;

    // if distance between points is > tear distance, remove the constraint,
    // i.e detach the points     
    if (dist > tear_distance) 
    	constraint.p1 = remove_constraint(constraint.p1, constraint);

    // calculate the amount by which positions are to be changed.
    var px = diff_x * diff * 0.5;
    var py = diff_y * diff * 0.5;

    // add the difference to first point
    constraint.p1.x += px;
    constraint.p1.y += py;
    // subtract the difference from second point
    constraint.p2.x -= px;
    constraint.p2.y -= py;
    return constraint;
};

// remove the given link from the point
function remove_constraint(point, constraint){

    var i = point.constraints.length;
    while (i--)
        if (point.constraints[i] == constraint) 
        	return point.constraints.splice(i, 1);
};

// update the cloth based on mouse events being performed on screen
function update_cloth(cloth_local) {
	var i = parameters.physics_accuracy;

    // Resolve the constraints for all the points physics_accuracy number of times
    while (i--) {
        var p = cloth_local.points.length;
        while (p--) 
            resolve_point_constraints(cloth_local.points[p]);
    }

    i = cloth_local.points.length;
    
    // update all the points by delta amount.
    while (i--) 
        cloth_local.points[i] = update_point(cloth_local.points[i], .016);

    return cloth_local;
};


