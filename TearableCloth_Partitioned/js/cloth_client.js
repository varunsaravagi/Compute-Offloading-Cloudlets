
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
    tear_distance : 60
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
    socket.emit('load_parameters', {'parameters' : parameters});
};

// Define a point and initialize certain properties
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

// add the input point as a constraint to this point.
// A point is attached to atmost 2 points:
// one on its left and one immediately above it.
Point.prototype.attach = function (point) {

    this.constraints.push(
        new Constraint(this, point)
    );
};

// Set the coordinates where the point is to be pinned
// Only applicable for the top row points of the cloth
Point.prototype.pin = function (pinx, piny) {
    this.pin_x = pinx;
    this.pin_y = piny;
};

// draw the point
Point.prototype.draw = function () {

    // Do not draw the top most points
    if (this.constraints.length <= 0) 
        return;

    var i = this.constraints.length;
    // Draw points for each constraint this point has
    while (i--) 
        this.constraints[i].draw();
};

// Initialize constraint
var Constraint = function (p1, p2) {

    this.p1 = p1;
    this.p2 = p2;
    this.length = spacing;
};


Constraint.prototype.draw = function () {

    ctx.moveTo(this.p1.x, this.p1.y);
    ctx.lineTo(this.p2.x, this.p2.y);
};


// Define a cloth
var Cloth = function () {

    // store all the points in the cloth
    this.points = [];

    var start_x = canvas.width / 2 - parameters.cloth_width * parameters.spacing / 2;

    // generate point for every combination of (x,y)
    for (var y = 0; y <= parameters.cloth_height; y++) {

        for (var x = 0; x <= parameters.cloth_width; x++) {

            //Position of the point
            var p = new Point(start_x + x * parameters.spacing, start_y + y * parameters.spacing);

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




// Draw the cloth
Cloth.prototype.draw = function () {

    ctx.beginPath();

    var i = cloth.points.length;
    // Loop over all the points and draw each point
    while (i--) 
        cloth.points[i].draw();

    ctx.stroke();
};


//------ Changed Function---------------
//------- MOVED TO SERVER --------
// update the cloth based on mouse events being performed on screen
// function update_cloth(cloth_local) {
// 	var i = parameters.physics_accuracy;

//     // Resolve the constraints for all the points physics_accuracy number of times
//     while (i--) {
//         var p = cloth_local.points.length;
//         while (p--)
//             resolve_constraints(cloth_local.points[p]); 
//     }

//     i = cloth_local.points.length;
    
//     // update all the points by delta amount.
//     while (i--) 
//         update_point(cloth_local.points[i], .016);

//     return cloth_local;
// };

var t = new timer();
var startTime;

// update the simulation
function update_simulation() {
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // call this method on the server side
    //cloth = update_cloth(cloth);
    console.log('Emitting update event');
    for(var i=0;i<cloth.points.length;i++){
        console.log('Emitting ' + i);
        socket.emit('update_cloth', {'point' : cloth.points[i]});
    }
    console.log('Emit successful');
    socket.on('cloth_updated', function(data){

    });
    //cloth.update();
    cloth.draw();
    var end = new Date().getTime();
    //console.log("Update finished: Time taken " + (end-start));
    requestAnimFrame(update_simulation);
    t.tick(new Date().getTime());
    if(end-startTime > 1000){
        startTime = new Date().getTime();
        document.getElementById('fps').innerHTML = "FPS: " + t.fps();
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
        e.preventDefault();
    };

    canvas.onmouseup = function (e) {
        mouse.down = false;
        e.preventDefault();
    };

    canvas.onmousemove = function (e) {
        mouse.px = mouse.x;
        mouse.py = mouse.y;
        var rect = canvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left,
        mouse.y = e.clientY - rect.top,
        e.preventDefault();
    };

    canvas.oncontextmenu = function (e) {
        e.preventDefault();
    };


    boundsx = canvas.width - 1;
    boundsy = canvas.height - 1;

    ctx.strokeStyle = '#888';
    
    load_variables();    
    // Define the points and constraints in the cloth
    cloth = new Cloth();
    startTime = new Date().getTime();
    update_simulation();
}

// call this function when the window loads
window.onload = function () {

    canvas = document.getElementById('c');
    ctx = canvas.getContext('2d');

    canvas.width = 560;
    canvas.height = 350;

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
        console.log("Touch move: Bounding rectangle: (" + rect.left + "," + rect.top + ")\n");  
    }, false);

    // detect end of touch
    canvas.addEventListener("touchend", function(event){
        event.preventDefault();        
        mouse.down = false;
        event.preventDefault();
    }, false);

    start();
};