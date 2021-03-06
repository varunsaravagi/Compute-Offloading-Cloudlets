/* This is the client side javascript file of cloth_server_diffser. It gets the points from
the server and draws them.
*/

// Establish the ws connection
var ws = new WebSocket('ws://' + '128.237.190.151' + ':1234');
ws.binaryType = 'arraybuffer';
ws.onopen = function event(){
                    //ws.send("connected");
}

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
	var data = {
        id : 'load_parameters',
        params : parameters
    };
    ws.send(JSON.stringify(data));
};

var past;
ws.onmessage = function(event){
    cloth = msgpack.decode(event.data);
    console.log(event);
    draw();
    curr = new Date().getTime();
    eteLatency = past ? (curr - past) : 0;
    fps.tick(curr);
    lfps = fps.fps();
    document.getElementById('fps').value = lfps;
    document.getElementById('elatency').value = eteLatency;
    result.add(eteLatency,lfps);
    past = new Date().getTime();
    var data = {
        id : 'updateCloth'
    };
    ws.send(JSON.stringify(data));
}

// Draw the cloth
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();

    var i = cloth.length;
    // Loop over all the points and draw each point
    while (i--)
        draw_points(cloth[i], i);

    ctx.stroke();
};

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
function start() {

    canvas.onmousedown = function (e) {
        mouse.button = e.which;
        mouse.px = mouse.x;
        mouse.py = mouse.y;
        var rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left,
        mouse.y = e.clientY - rect.top,
        mouse.down = true;
        send_mouse();
        e.preventDefault();

    };

    canvas.onmouseup = function (e) {
        mouse.down = false;
        send_mouse();
        e.preventDefault();
    };

    canvas.onmousemove = function (e) {
        mouse.px = mouse.x;
        mouse.py = mouse.y;
        var rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left,
        mouse.y = e.clientY - rect.top,
        send_mouse();
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
        send_mouse();
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
        send_mouse();
        //console.log("Touch move: Bounding rectangle: (" + rect.left + "," + rect.top + ")\n");
    }, false);

    // detect end of touch
    canvas.addEventListener("touchend", function(event){
        event.preventDefault();
        mouse.down = false;
        event.preventDefault();
        send_mouse();
    }, false);

    start();
};

function send_mouse(){
    var data = {
        id : 'mouse',
        mouseData : mouse
    };
    ws.send(JSON.stringify(data));
}

function send(){
	elatency = result.getSElatency();
	lfps = result.getSFps();
	fileName = 'P'+parameters.physics_accuracy+'_H'+parameters.cloth_height+'_W'+parameters.cloth_width;
	toSend = {
        id : 'dataPoints',
		name : fileName,
		elatency : elatency,
		fps : lfps
	};
    ws.send(JSON.stringify(toSend));
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
