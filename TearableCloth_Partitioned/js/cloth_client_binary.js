/* This is the client side javascript file of cloth_server_binary. It gets the points from 
the server and draws them.
*/


var client   = new BinaryClient('ws://128.237.190.151:1234');
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

// Load the parameters required for simulation
var stream;
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
    
};

function start_sim(){
    var param = {
        id : 'load_parameters',
        parameters : parameters
    }
    encoded = msgpack.encode(param);
    stream = client.send({buffer : encoded}, 'load_parameters');
    
    stream.on('data', function(data){
        d = new Date();        
        t = d.getHours() + ':'+ d.getMinutes() + ':' + d.getSeconds() + ':' + d.getMilliseconds();
        
        console.log('Received stream at: ' + t);
        var decoded = msgpack.decode(data.buffer);
        console.log(decoded);
        cloth = decoded;
        draw();
        emit_update(stream);
        // switch(decoded.id){

        //     case 'newCloth':
        //         cloth = decoded.cloth;
        //         draw();
        //         emit_update(stream);
        //         break;

        //     case 'updatedCloth':
        //         cloth = decoded.cloth;
        //         draw();
        //         emit_update(stream);
        //         break;
        // }   
    });
}


var startTime, endTime;

function emit_update(stream){
    var param = {
        id : 'updateCloth',
        t : new Date().getTime(),
    };
    encoded = msgpack.encode(param);
    stream.write({buffer : encoded});
}


function render(data){
    d = new Date();
    console.log('Event received at: ' + d.getHours() + ':' +
            d.getMinutes() + ':' + d.getSeconds() + ':' + d.getMilliseconds());

    d = new Date();
    console.log('Event emitted at: ' + d.getHours() + ':' +
            d.getMinutes() + ':' + d.getSeconds() + ':' + d.getMilliseconds());

    client.send(d.getTime(), 'updateCloth');
    startTime = new Date().getTime();
    cloth = msgpack.decode(data.buffer);
    endTime = new Date().getTime();
    console.log('Time taken for decode: ' + (endTime-startTime));
   
    startDraw = new Date().getTime();
    draw();
    console.log('Time taken to draw ' + (new Date().getTime() - startDraw));    
    
    doEmit = true;
    console.log('-----------------------');
};

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

function send_mouse(){
    var param = {
        id : 'mouse',
        mouse : mouse
    };
    var encoded = msgpack.encode(param);
    client.send({buffer:encoded}, 'mouse');
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


    boundsx = canvas.width - 1;
    boundsy = canvas.height - 1;

    ctx.strokeStyle = '#888';
    
    load_variables();
    start_sim();    
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
        client.send(mouse, 'mouse');
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
        client.send(mouse, 'mouse');
        //console.log("Touch move: Bounding rectangle: (" + rect.left + "," + rect.top + ")\n");  
    }, false);

    // detect end of touch
    canvas.addEventListener("touchend", function(event){
        event.preventDefault();        
        mouse.down = false;
        event.preventDefault();
        client.send(mouse, 'mouse');
    }, false);

    start();
};