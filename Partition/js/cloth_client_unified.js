/*
 This is the single unified client side version of the Cloth simulation.
 It can run as an offloading component and also completely on the device.
*/

// by default, run in offloaded operation
var offload;

var disconnected = -2;

var manager = io.Manager('http://localhost:1235', {'reconnection' : false});
//manager.socket('/namespace');
manager.on('connect_error', function() {
    console.log("Connection error!");
		disconnected = -1;
});

var socket = io.connect("http://localhost:1235", {'reconnection' : false});
// get the socket connection
//var cloudletSocket = io.connect("http://localhost:1235");

socket.on('connect', function(){
	console.log("Connected to offloading: " + new Date().getTime());
	disconnected = 0;
	//cloudletSocket.disconnect();
	//socket = io.connect("http://localhost:1235", {'forceNew' : true});
});

//console.log(cloudletSocket.socket.connected);

//TO-DO check socket status here and set the offload parameter
// if(!socket.connected)
//  offload = false;


// global parameters (common)
var parameters = {
	  physics_accuracy : 3,
    mouse_influence : 20,
    mouse_cut : 5,
    gravity : 1200,
    cloth_height : 30,
    cloth_width : 50,
    start_y : 20,
    spacing : 7,
    tear_distance : 60,
    canvas_width : 0,
    canvas_height : 0
};

// global parameters (common)
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

// only for not-offloading
window.requestAnimFrame =
    window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function (callback) {
        window.setTimeout(callback, 1000 / 60);
};

// global paramters (common)
var fps = new timer();
var result = new dataPoints();

// Load the parameters required for simulation (common)
function load_variables(){
    parameters.physics_accuracy = parseInt(document.getElementById('pa_text').value),
    parameters.mouse_influence = parseInt(document.getElementById('mi_text').value),
    parameters.mouse_cut = parseInt(document.getElementById('mc_text').value),
    parameters.gravity = parseInt(document.getElementById('g_text').value),
    parameters.cloth_height = parseInt(document.getElementById('ch_text').value),
    parameters.cloth_width = parseInt(document.getElementById('cw_text').value),
    parameters.start_y = parseInt(document.getElementById('sy_text').value),
    parameters.spacing = parseInt(document.getElementById('s_text').value),
    parameters.tear_distance = parseInt(document.getElementById('td_text').value);
    canvas.width = parseInt(document.getElementById('caw_text').value);
    canvas.height = parseInt(document.getElementById('cah_text').value);
    parameters.canvas_width = canvas.width;
    parameters.canvas_height = canvas.height;
		result.reset();
		window.clearInterval(average);
		average = window.setInterval(getAverage, 6000);
		if(offload)
      // send the parameters to the server
		  socket.emit('load_parameters', {'parameters' : parameters});
};

// Received new cloth from the server
socket.on('newCloth', function(data){
		cloth = msgpack.decode(data.buffer);
		draw();
		socket.emit('updateCloth', {});
});

// offloading
var past,
		curr;

// Received updated cloth from server (offloading)
socket.on('updatedCloth', function(data){

		cloth = msgpack.decode(data.buffer);

		draw();
		//eteLatency = new Date().getTime() - rcvData.time;
		eteLatency = past ? (new Date().getTime() - past) : 0;
		//console.log('Curr: ' + curr + ', Received data: ' + received.time);
		fps.tick(new Date().getTime());
		lfps = fps.fps();
		past = new Date().getTime();
		document.getElementById('elatency').value = eteLatency;//result.avElatency();
		document.getElementById('fps').value = lfps;//result.avFps();
				//document.getElementById('nlatency').value = nlatency;//result.avNlatency();
				//document.getElementById('bandwidth').value = mbps;//result.avBandwidth();
		result.add(eteLatency,lfps);
		socket.emit('updateCloth', {t : past});
});



// Draw the cloth (offloading)
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();

    var i = cloth.length;
    // Loop over all the points and draw each point
    while (i--)
        draw_points(cloth[i], i);

    ctx.stroke();
};

// Draw the points (offloading)
function draw_points(point, index){
		// point[0] has x coordinate
		// point[1] has y coordinate
		// point[2] has constraint type
		var x = point[0],
			  y = point[1];

		// get the constraints available with the point
		constraintType = determine_constraint(point[2]);
		leftConstraint = constraintType[0];
		topConstraint = constraintType[1];

		// Get the indices of the top and the left points
		topIndex = index - (parameters.cloth_width + 1);
		// left most points do not have a left index.
		// These are the points which are divisible by the x range
		leftIndex = index % (parameters.cloth_width + 1) == 0 ?
										-1 : index - 1;

		// draw a line between the current point and the point at its top
		if(topConstraint && topIndex >= 0){
			ctx.moveTo(x,y);
			ctx.lineTo(cloth[topIndex][0], cloth[topIndex][1]);
		};

    // draw a line between the current point and the point at its left
		if(leftConstraint && leftIndex >= 0){
			ctx.moveTo(x,y);
			ctx.lineTo(cloth[leftIndex][0], cloth[leftIndex][1]);
		};
}

// Determine the type of constraint (offloading)
function determine_constraint(constraintType){
	var topConstraint,
			leftConstraint;

	switch(constraintType){
		case 3:
			topConstraint = true;
			leftConstraint = true;
			break;
		case 2:
			topConstraint = true;
			leftConstraint = false;
			break;
		case 1:
			topConstraint = false;
			leftConstraint = true;
			break;
		case 0:
			topConstraint = false;
			leftConstraint = false;
			break;
	};
	return [leftConstraint, topConstraint];
}


// Define a point and initialize certain properties (not-offloading)
var Point = function (x, y) {

    this.x = x;
    this.y = y;
    this.px = x;
    this.py = y;
    this.vx = 0;
    this.vy = 0;
    this.pin_x = null;
    this.pin_y = null;

    this.constraints = [];
};

// Add update property to Point (not-offloading)
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
};

// draw the point (not-offloading)
Point.prototype.draw = function () {

    // Do not draw the top most points
    if (this.constraints.length <= 0) return;

    var i = this.constraints.length;
    // Draw points for each constraint this point has
    while (i--)
        this.constraints[i].draw();
};

// Resolve the constraints of the point with the attached points (not-offloading)
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
//(not-offloading)
Point.prototype.attach = function (point) {

    this.constraints.push(
        new Constraint(this, point)
    );
};

// remove the given link from the point (not-offloading)
Point.prototype.remove_constraint = function (lnk) {

    var i = this.constraints.length;
    while (i--)
        if (this.constraints[i] == lnk) this.constraints.splice(i, 1);
};

// add force on the point in both the x and y directions (not-offloading)
Point.prototype.add_force = function (x, y) {

    this.vx += x;
    this.vy += y;
};

// Set the coordinates where the point is to be pinned
// Only applicable for the top row points of the cloth
// (not-offloading)
Point.prototype.pin = function (pinx, piny) {
    this.pin_x = pinx;
    this.pin_y = piny;
};

//(not-offloading)
var Constraint = function (p1, p2) {

    this.p1 = p1;
    this.p2 = p2;
    this.length = parameters.spacing;
};

// Resolve the constraint (not-offloading)
Constraint.prototype.resolve = function () {

    // Get the new distance between the two points in the constraint
    var diff_x = this.p1.x - this.p2.x,
        diff_y = this.p1.y - this.p2.y,
        dist = Math.sqrt(diff_x * diff_x + diff_y * diff_y),
        //Get the difference from the length. No idea why this formula was used
        diff = (this.length - dist) / dist;

    // if distance between points is > tear distance, remove the constraint,
    // i.e detach the points
    if (dist > parameters.tear_distance) this.p1.remove_constraint(this);

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

// (not-offloading)
Constraint.prototype.draw = function () {

    ctx.moveTo(this.p1.x, this.p1.y);
    ctx.lineTo(this.p2.x, this.p2.y);
};

// (not-offloading)
var Cloth = function () {

    // store all the points in the cloth
    this.points = [];

    var start_x = canvas.width / 2 - parameters.cloth_width * parameters.spacing / 2;

    // generate point for every combination of (x,y)
    for (var y = 0; y <= parameters.cloth_height; y++) {

        for (var x = 0; x <= parameters.cloth_width; x++) {

            //Position of the point
            var p = new Point(start_x + x * parameters.spacing, parameters.start_y + y * parameters.spacing);

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
        }
    }
};

// update the points in the cloth (not-offloading)
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

// Draw the cloth (not-offloading)
Cloth.prototype.draw = function () {

    ctx.beginPath();

    var i = cloth.points.length;
    // Loop over all the points and draw each point
    while (i--)
        cloth.points[i].draw();

    ctx.stroke();
};

// (not-offloading)
function update() {
    startTime = new Date().getTime();

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    cloth.update();
    cloth.draw();
    fps.tick(new Date().getTime());
    eteLatency = new Date().getTime() - startTime;
    document.getElementById('elatency').value = eteLatency;//result.avElatency();
    document.getElementById('fps').value = fps.fps();//result.avFps();
    result.add(eteLatency,fps.fps());

    requestAnimFrame(update);
}

// start the simulation (common)
function start() {

    canvas.onmousedown = function (e) {
        mouse.button = e.which;
        mouse.px = mouse.x;
        mouse.py = mouse.y;
        var rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left,
        mouse.y = e.clientY - rect.top,
        mouse.down = true;
				e.preventDefault();
        if(offload)
					socket.emit('mouse', {mouseData:mouse});
    };

    canvas.onmouseup = function (e) {
        mouse.down = false;
        e.preventDefault();
				if(offload)
        	socket.emit('mouse', {mouseData:mouse});
    };

    canvas.onmousemove = function (e) {
        mouse.px = mouse.x;
        mouse.py = mouse.y;
        var rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left,
        mouse.y = e.clientY - rect.top,
        e.preventDefault();
				if(offload)
					socket.emit('mouse', {mouseData:mouse});
    };

    canvas.oncontextmenu = function (e) {
        e.preventDefault();
    };

    ctx.strokeStyle = '#888';

    load_variables();

		boundsx = canvas.width - 1;
		boundsy = canvas.height - 1;

		if(!offload){
			console.log('not offloading: ' + new Date().getTime())
			cloth = new Cloth();
			update();
		}
}

//common
window.onload = function () {

    canvas = document.getElementById('c');
    ctx = canvas.getContext('2d');

    canvas.width = 560;
    canvas.height = 350;


    canvas.addEventListener("touchstart", function(event){
        event.preventDefault();
        var touch = event.targetTouches[0];
        mouse.button = event.targetTouches.length;
        mouse.px = mouse.x;
        mouse.py = mouse.y;
        var rect = canvas.getBoundingClientRect();
        mouse.x = touch.clientX - rect.left,
        mouse.y = touch.clientY - rect.top,
        mouse.down = true;
				if(offload)
					socket.emit('mouse', {mouseData:mouse});
    }, false);

    canvas.addEventListener("touchmove", function(event){
        event.preventDefault();
        var touch = event.targetTouches[0];
        mouse.px = mouse.x;
        mouse.py = mouse.y;
        var rect = canvas.getBoundingClientRect();
        mouse.x = touch.clientX - rect.left,
        mouse.y = touch.clientY - rect.top,
        event.preventDefault();
        if(offload)
					socket.emit('mouse', {mouseData:mouse});
    }, false);

    canvas.addEventListener("touchend", function(event){
        event.preventDefault();
        mouse.down = false;
        event.preventDefault();
				if(offload)
					socket.emit('mouse', {mouseData:mouse});
    }, false);

    check_connection();
};


function check_connection(){
	if(disconnected == -2){
		setTimeout(check_connection, 100);
	}
	else {
		offload = disconnected == 0 ? true : false;
		start();
	}
}
// send the file to server (common)
function send(){
	elatency = result.getSElatency();
	lfps = result.getSFps();
	fileName = 'P'+physics_accuracy+'_H'+cloth_height+'_W'+cloth_width;
	toSend = {
		name : fileName,
		elatency : elatency,
		fps : lfps
	};
	socket.emit('dataPoints', {dataPoints : toSend});
}

// get the average (common)
function getAverage(){
	console.log('Getting average');
	result.average();
	// send the readngs to server when we have 10 readings
	if(result.getReadings() == 10){
		send();
		alert('Sent to server');
	}
}

// set interval for readings (common)
var average = window.setInterval(getAverage, 6000);
