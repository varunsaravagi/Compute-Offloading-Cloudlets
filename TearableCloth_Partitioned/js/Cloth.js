/*
Copyright (c) 2013 Suffick at Codepen (http://codepen.io/suffick) and GitHub (https://github.com/suffick)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

// settings
function getValue(elementId){
    return document.getElementById(elementId).value;
}

// parameters required for simulation

// attempt to get the parameters from the HTML page. Giving error from cloth_width onwards.

var physics_accuracy,
    mouse_influence,
    mouse_cut,
    gravity,
    cloth_height,
    cloth_width,
    start_y,
    spacing,
    tear_distance;


function load_variables(){
    physics_accuracy = parseInt(document.getElementById('pa_text').value),//getValue("physics_accuracy"),
    mouse_influence = parseInt(document.getElementById('mi_text').value),//20,//getValue("mouse_influence"),
    mouse_cut = parseInt(document.getElementById('mc_text').value),//5,
    gravity = parseInt(document.getElementById('g_text').value),//1200,
    cloth_height = parseInt(document.getElementById('ch_text').value),// 30,
    cloth_width = parseInt(document.getElementById('cw_text').value),//50,
    start_y = parseInt(document.getElementById('sy_text').value),//20,
    spacing = parseInt(document.getElementById('s_text').value),//7,
    tear_distance = parseInt(document.getElementById('td_text').value);//60;
    canvas.width = parseInt(document.getElementById('caw_text').value);
    canvas.height = parseInt(document.getElementById('cah_text').value);

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
    this.add_force(0, gravity);

    delta *= delta;
    nx = this.x + ((this.x - this.px) * .99) + ((this.vx / 2) * delta);
    ny = this.y + ((this.y - this.py) * .99) + ((this.vy / 2) * delta);

    this.px = this.x;
    this.py = this.y;

    this.x = nx;
    this.y = ny;

    this.vy = this.vx = 0
};

// draw the point
Point.prototype.draw = function () {

    // Do not draw the top most points
    if (this.constraints.length <= 0) return;

    var i = this.constraints.length;
    // Draw points for each constraint this point has
    while (i--) 
        this.constraints[i].draw();
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
    this.length = spacing;
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
    if (dist > tear_distance) this.p1.remove_constraint(this);

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

Constraint.prototype.draw = function () {

    ctx.moveTo(this.p1.x, this.p1.y);
    ctx.lineTo(this.p2.x, this.p2.y);
};

var Cloth = function () {

    // store all the points in the cloth
    this.points = [];

    var start_x = canvas.width / 2 - cloth_width * spacing / 2;

    // generate point for every combination of (x,y)
    for (var y = 0; y <= cloth_height; y++) {

        for (var x = 0; x <= cloth_width; x++) {

            //Position of the point
            var p = new Point(start_x + x * spacing, start_y + y * spacing);

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
            y != 0 && p.attach(this.points[x + (y - 1) * (cloth_width + 1)])

            this.points.push(p);
        }
    }
};

// update the points in the cloth : COMPUTATION
Cloth.prototype.update = function () {

    var i = physics_accuracy;

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

// Draw the cloth
Cloth.prototype.draw = function () {

    ctx.beginPath();

    var i = cloth.points.length;
    // Loop over all the points and draw each point
    while (i--) 
        cloth.points[i].draw();

    ctx.stroke();
};

var t = new timer();
var startTime;

function update() {
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    cloth.update();
    cloth.draw();
    var end = new Date().getTime();
    //console.log("Update finished: Time taken " + (end-start));
    requestAnimFrame(update);
    t.tick(new Date().getTime());
    if(end-startTime > 1000){
        startTime = new Date().getTime();
        document.getElementById('fps').innerHTML = "FPS: " + t.fps();
    }

    
}

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
    update();
}

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
        console.log("Touch move: Bounding rectangle: (" + rect.left + "," + rect.top + ")\n");  
    }, false);

    canvas.addEventListener("touchend", function(event){
        event.preventDefault();        
        mouse.down = false;
        event.preventDefault();
    }, false);

    start();
};
