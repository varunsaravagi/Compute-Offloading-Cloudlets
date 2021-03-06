/* This is the client side javascript file of cloth_server_diffser. It gets the points from
the server and draws them.
*/

// get the socket connection
var socket = io.connect();

// global parameters
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


var fps = new timer();
var result = new dataPoints();
var ignoreReadings = 3; //ignore initial 5 readings.

// Load the parameters required for simulation
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
	fps.reset();
	window.clearInterval(average);
	average = window.setInterval(getAverage, 6000);
	// send the parameters to the server
	socket.emit('load_parameters', {'parameters' : parameters});
};

socket.on('connect', function(){
	// Received new cloth from the server
	socket.on('newCloth', function(data){
		//cloth = data.cloth;
    cloth = msgpack.decode(data.buffer);

		draw();
		socket.emit('updateCloth', {});
	});

	var past;

	// Received updated cloth from server
	socket.on('updatedCloth', function(data){
		//cloth = data.cloth;
        cloth = msgpack.decode(data.buffer);
		//d = msgpack.decode(data.buffer);
		//cloth = d.cloth;
		//console.log('Recieved cloth: id: ' + d.id + ', time: ' + d.time + ' @ ' + new Date().getTime());
		draw();
        curr = new Date().getTime();
		eteLatency = past ? (curr - past) : 0
		//eteLatency = (new Date().getTime() - past);
		fps.tick(curr);
		lfps = fps.fps();
        past = new Date().getTime();
		document.getElementById('fps').value = lfps;
		document.getElementById('elatency').value = eteLatency;
		// Do not add the initial ignoreReadings value
		//if(ignoreReadings == 0)
        result.add(eteLatency,lfps);
        //else
          //  ignoreReadings--;

		socket.emit('updateCloth', {});
	});

    // socket.on('receivedMouse', function(data){
		//
    // });

})

// Draw the cloth
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
		console.log('---------------------------------');
    // cloth is a single array. Since each point has 2 coords,
		// total number of points are length/2.
		var length = cloth.length/2;
		//console.log('Length: ' + cloth.length + '\nPoints: ' + cloth);
    // Loop over all the points and draw each point
		//var index = length;
		while(length--)
        draw_points(length);

    ctx.stroke();
		console.log('---------------------------------');
};

// Draw point at index index
function draw_points(index)	{
	// point[0] has x coordinate
	// point[1] has y coordinate
	var x = cloth[2*index],
			y = cloth[2*index + 1];
	var leftConstraint = true,
			topConstraint = true;
  //console.log('Index: '+index + ', (x,y): '+ x + ', ' + y);
	if(x >=0 && y < 0){
		leftConstraint = false;
		topConstraint = true;
		y = -y;
	}
	else if(x < 0 && y >= 0){
		leftConstraint = true;
		topConstraint = false;
		x = -x;
	}
	else if(x < 0 && y < 0){
		leftConstraint = false;
		topConstraint = false;
		x = -x;
		y = -y;
	}
	// Get the indices of the top and the left points
	topIndex = index - (parameters.cloth_width + 1);
	// left most points do not have a left index.
	// These are the points which are divisible by the x range
	leftIndex = index % (parameters.cloth_width + 1) == 0 ?
										-1 : index - 1;


	// draw a line between the current point and the point at its top
	if(topConstraint && topIndex >= 0){
		xTopIndex = cloth[2*topIndex];
		yTopIndex = cloth[2*topIndex + 1];
		//console.log('TopIndex: '+topIndex + ', (x,y): '+ xTopIndex + ', ' + yTopIndex);
		ctx.moveTo(x,y);
		//ctx.lineTo(Math.abs(cloth[topIndex][0]), Math.abs(cloth[topIndex][1]));
		ctx.lineTo((xTopIndex < 0 ? -xTopIndex : xTopIndex),
		 		(yTopIndex < 0 ? -yTopIndex : yTopIndex));
		// console.log('Index: ' + index + ', Line from: (' +
		// 		x + ',' + y + '), (' + cloth[topIndex][0] + ',' + cloth[topIndex][1] + ')');
	};

    // draw a line between the current point and the point at its left
	if(leftConstraint && leftIndex >= 0){
		xLeftIndex = cloth[2*leftIndex];
		yLeftIndex = cloth[2*leftIndex + 1];
		//console.log('LeftIndex: '+leftIndex + ', (x,y): '+ xLeftIndex + ', ' + yLeftIndex);
		ctx.moveTo(x,y);

		//ctx.lineTo(Math.abs(cloth[leftIndex][0]), Math.abs(cloth[leftIndex][1]));
		ctx.lineTo((xLeftIndex < 0 ? -xLeftIndex : xLeftIndex),
		 		(yLeftIndex < 0 ? -yLeftIndex : yLeftIndex));
		// console.log('Index: ' + index + ', Line from: (' +
		// 		x + ',' + y + '), (' + cloth[leftIndex][0] + ',' + cloth[leftIndex][1] + ')');
	};
}

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
// start the simulation
function start(reconnect) {

	socket.receiveBuffer = [];
	socket.sendBuffer = [];
	io.packetBuffer = [];

    canvas.onmousedown = function (e) {
        mouse.button = e.which;
        mouse.px = mouse.x;
        mouse.py = mouse.y;
        var rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left,
        mouse.y = e.clientY - rect.top,
        mouse.down = true;
        socket.emit('mouse', {mouseData:mouse});
        e.preventDefault();

    };

    canvas.onmouseup = function (e) {
        mouse.down = false;
        socket.emit('mouse', {mouseData:mouse});
        e.preventDefault();
    };

    canvas.onmousemove = function (e) {
        mouse.px = mouse.x;
        mouse.py = mouse.y;
        var rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left,
        mouse.y = e.clientY - rect.top,
        socket.emit('mouse', {mouseData:mouse});
        e.preventDefault();
    };

    canvas.oncontextmenu = function (e) {
        e.preventDefault();
    };

    ctx.strokeStyle = '#888';
	load_variables();
	boundsx = canvas.width - 1;
	boundsy = canvas.height - 1;
}

// call this function when the window loads
window.onload = function () {

    canvas = document.getElementById('c');
    ctx = canvas.getContext('2d');


    // detect touch event
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
        socket.emit('mouse', {mouseData:mouse});
    }, false);

    // detect touch movement
    canvas.addEventListener("touchmove", function(event){
        event.preventDefault();
        var touch = event.targetTouches[0];
        mouse.px = mouse.x;
        mouse.py = mouse.y;
        var rect = canvas.getBoundingClientRect();
        mouse.x = touch.clientX - rect.left,
        mouse.y = touch.clientY - rect.top,
        event.preventDefault();
        socket.emit('mouse', {mouseData:mouse});
        //console.log("Touch move: Bounding rectangle: (" + rect.left + "," + rect.top + ")\n");
    }, false);

    // detect end of touch
    canvas.addEventListener("touchend", function(event){
        event.preventDefault();
        mouse.down = false;
        event.preventDefault();
        socket.emit('mouse', {mouseData:mouse});
    }, false);

    start();
};

function send(){
	elatency = result.getSElatency();
	lfps = result.getSFps();
	fileName = 'P'+parameters.physics_accuracy+'_H'+parameters.cloth_height+'_W'+parameters.cloth_width;
	toSend = {
		name : fileName,
		elatency : elatency,
		fps : lfps
	};
	socket.emit('dataPoints', {dataPoints : toSend});
}

function getAverage(){
	console.log('Getting average');
	result.average();
	// send the readngs to server when we have 10 readings
	if(result.getReadings() == 10){
		send();
		alert('Sent to server');
	}
}

// get average of the readings every 6 seconds
var average = window.setInterval(getAverage, 6000);
