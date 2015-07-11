/* This is the client side javascript file of cloth_server_buffer. It gets the points from
the server and draws them.
*/


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

window.requestAnimFrame =
    window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.oRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function (callback) {
        window.setTimeout(callback, 1000 / 60);
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
    parameters.physics_accuracy = parseInt(document.getElementById('pa_text').value),//getValue("physics_accuracy"),
    parameters.mouse_influence = parseInt(document.getElementById('mi_text').value),//20,//getValue("mouse_influence"),
    parameters.mouse_cut = parseInt(document.getElementById('mc_text').value),//5,
    parameters.gravity = parseInt(document.getElementById('g_text').value),//1200,
    parameters.cloth_height = parseInt(document.getElementById('ch_text').value),// 30,
    parameters.cloth_width = parseInt(document.getElementById('cw_text').value),//50,
    parameters.start_y = parseInt(document.getElementById('sy_text').value),//20,
    parameters.spacing = parseInt(document.getElementById('s_text').value),//7,
    parameters.tear_distance = parseInt(document.getElementById('td_text').value);//60;
    canvas.width = parseInt(document.getElementById('caw_text').value);
    canvas.height = parseInt(document.getElementById('cah_text').value);
    parameters.canvas_width = canvas.width;
    parameters.canvas_height = canvas.height;
		result.reset();
    socket.emit('load_parameters', {'parameters' : parameters});
};

var startTime, endTime;

// Received new cloth from the server
socket.on('newCloth', function(data){
    received = data.buffer;
    cloth = msgpack.decode(received);
    draw();
    socket.emit('updateCloth', {});
});

var past, curr;
// Received updated cloth from server
socket.on('updatedCloth', function(data){

		received = data.parameters;
		//nlatency = new Date().getTime() - received.time;
		//console.log('Curr: ' + curr + ', Received: ' + received.time);
		//received = data.buffer;
		// var dataSize = received.data.byteLength;
		// bps = (dataSize*8*1000)/nlatency;
		// mbps = bps/(1024*1024).toFixed(2);

		rcvData = msgpack.decode(received.data);
		cloth = rcvData.cloth;

    draw();
		//eteLatency = new Date().getTime() - rcvData.time;
		eteLatency = past ? (new Date().getTime() - past)/2 : 0;
		//console.log('Curr: ' + curr + ', Received data: ' + received.time);
		fps.tick(new Date().getTime());

		past = new Date().getTime();
        document.getElementById('elatency').value = eteLatency;//result.avElatency();
        document.getElementById('fps').value = fps.fps();//result.avFps();
        //document.getElementById('nlatency').value = nlatency;//result.avNlatency();
        //document.getElementById('bandwidth').value = mbps;//result.avBandwidth();
        result.add(eteLatency,fps.fps());
		socket.emit('updateCloth', {t : past});


});

// Draw the cloth
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();

    var i = cloth.length;
    // Loop over all the points and draw each point
    while (i--)
        draw_points(cloth[i]);

    ctx.stroke();
};

function draw_points(point){
    if(point.length < 2)
        return;
    // get the number of constraint points
    // (point.length - 2) would give the number of entries for the constraint.
    // Divide by 2 to get the number of constraint pair
    var i = (point.length - 2) / 2;

    for(var j=0;j<=i;j=j+2){
        ctx.moveTo(point[0], point[1]);
        ctx.lineTo(point[j+2], point[j+3]);
    }

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


    boundsx = canvas.width - 1;
    boundsy = canvas.height - 1;

    ctx.strokeStyle = '#888';

    load_variables();
}

// call this function when the window loads
window.onload = function () {

    canvas = document.getElementById('c');
    ctx = canvas.getContext('2d');

    // canvas.width = 560;
    // canvas.height = 350;

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

 // window.setTimeout(function(){
 // 	document.getElementById('elatency').value = result.avElatency();
 // 	document.getElementById('fps').value = result.avFps();
 // 	//document.getElementById('nlatency').value = result.avNlatency();
 // 	//document.getElementById('bandwidth').value = result.avBandwidth();
 // 	result.reset();
 // }, 1000);
