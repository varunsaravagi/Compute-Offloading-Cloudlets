/*
 This is auto-generated file from browserify. This is used to run the application
 purely on client side.
*/

(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global,__filename){
/* This file uses socket.io to store the points and transmit them over the server in a binary format.
Only an array of points is being sent over the network. The neighbours would be re-discovered at the client.

Serialization format:
A point contains 2 numbers:
  (x,y) coordinates of the point, only integers.
  The neighboring constraint position is encoded in x,y only.
  x -ve, y -ve No constraint
  x -ve, y +ve Left constraint only
  x +ve, y -ve Top constraint only
  x +ve, y +ve Both constraints

*/

var msgpack = require('msgpack-js-browser');
var fs = require('fs');
// var io = require('socket.io').listen(1236);
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
   this.topConstraint = false;
   this.leftConstraint = false;
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
   },
   sCloth;

var parameters;
var displayed = false;

var exports = module.exports = {}

global.run = exports.run = function(socket){
  // listen for socket events
  //io.sockets.on('connection', function(socket){

     // received parameters from client.
     socket.on('load_parameters', function(data){

         load_parameters(data.parameters);
         displayed = false;
         console.log('Cloth length: ' + sCloth.points.length);
         // encode and send over the server
         var encoded = msgpack.encode(sCloth.points);
         console.log('Encoded: ' + encoded.byteLength);
         socket.emit('updatedCloth', {image: true, buffer : encoded})
     });

     //received update cloth event from client
     socket.on('updateCloth', function(data){
         var start = new Date().getTime();
         // update the cloth
         sCloth.points = [];
         cloth.update();
         // encode the simpler version of cloth
         var encoded = msgpack.encode(sCloth.points);
         // display the size of cloth. (display only once)
         if(!displayed){
             console.log('Size of Data: ' + encoded.byteLength);
             displayed = true;
         }

         // emit the updated cloth
         socket.emit('updatedCloth', {image: true, buffer : encoded});
     });

     // received mouse event from client
     socket.on('mouse', function(data){
         mouse = data.mouseData;
     });

     socket.on('disconnect', function(){
       console.log('Socket disconnected. Deleted file: ' + __filename);
       fs.unlinkSync(__filename);
     });
}

global.load_params = function(param){
  load_parameters(param)
}
function load_parameters(param){
  parameters = param;
  console.log('Parameters received: ' + parameters.physics_accuracy +' ' + parameters.cloth_height + ' ' + parameters.cloth_width);
  boundsx = parameters.canvas_width - 1;
  boundsy = parameters.canvas_height - 1;
  // initialize the cloth
  sCloth = new SerializedCloth();
  cloth = new Cloth();
}




//--------SIMULATION SPECIFIC FUNCTIONS---------------

function create_point(point){
  var x = Math.round(point.x),
      y = Math.round(point.y);
  var constraintType;
  if(point.topConstraint){ //there is a top constraint
    if (!point.leftConstraint){ //there is no left constraint
      y = -y;
    }
  }
  else { //there is no top constraint
    if (point.leftConstraint) //there is a left constraint
      x = -x;
    else { // there is no left constraint
      x = -x;
      y = -y;
    }
  }

  return [x,y];
}
// Point data structure to pass to client
var SerializedCloth = function(){
   this.points = [];
   /*
    points is a 1-D array containing
    all the points in the cloth.

    Each point has two coordinates:
       x, y
    The constraints are defined using the
    sign of x, y.
    --> -x, -y : No constraints
    --> -x, +y : Left constraint
    --> +x, -y : Top constraint
    --> +x, +y : Both constraints

    Each point in the cloth would be at
    position 2*index, 2*index + 1 in this
    array, where
    index -> index of point in original cloth
   */
};

// update the point at the index
SerializedCloth.prototype.update = function(point,index){
   // index is the position of the point in the original Cloth.
   // add the coordinates of the point in the serialized Cloth

   // Final Structure: [x0,y0,x1,y1,x2,y2,...........xn,yn]
   var coord = create_point(point);
   this.points[2*index] = coord[0]; //add x coordinate
   this.points[2*index + 1] = coord[1]; //add y coordinate
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

       } else if (dist < parameters.mouse_cut){
         this.constraints = [];
         this.topConstraint = false;
         this.leftConstraint = false;
       }
   }

   // add gravity in the y direction
   this.add_force(0, parameters.gravity);

   delta *= delta;
   var nx = this.x + ((this.x - this.px) * .99) + ((this.vx / 2) * delta);
   var ny = this.y + ((this.y - this.py) * .99) + ((this.vy / 2) * delta);

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
   while (i--){
     this.constraints[i].resolve();
   }


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
   while (i--){

     // if i==0, then this can be a top constraint or a left constraint,
     // depending on the position of the point or if there is no left constraint.
     if (this.constraints[i] == lnk) {
       this.constraints.splice(i, 1);
       if(i==1){
         // if i==1, then this is definitely a top constraint.
         this.topConstraint = false;
       }
       else{ //i == 0
         // there is a topConstraint
         // Two cases are possible. If there is a left constraint, then we
         // are removing the left constraint. If there is no left constraint,
         // then we are removing the top constraint.
         if(this.topConstraint){
           if(this.leftConstraint){
             this.leftConstraint = false;
           }
           else{
            this.topConstraint = false;
           }
         }
         else {
           // there is no top constraint. Then this is definitely a left constraint.
           this.leftConstraint = false;
         }
       }// end else
     }// end if this.constraints[i]
   }// end while
}; // end function

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

   var start_x = parameters.canvas_width / 2 - Math.floor(parameters.cloth_width * parameters.spacing / 2);
   var index;
   // generate point for every combination of (x,y)
   for (var y = 0; y <= parameters.cloth_height; y++) {

       for (var x = 0; x <= parameters.cloth_width; x++) {

           //Position of the point
           index = (y*(parameters.cloth_width+1)) + x;
           var p = new Point(start_x + x * parameters.spacing, parameters.start_y + y * parameters.spacing, index);

           // if it is not the first point in the row, attach it with the point just before it
           if (x != 0){
             p.attach(this.points[this.points.length - 1]);
             p.leftConstraint = true;
           }

           // if it is the first row, pin the point at the coordinate. This is to keep the cloth
           // attached from the top.
           y == 0 && p.pin(p.x, p.y);

           // if it is not the first row, attach the point to the point just above it in the matrix
           // |.|.|.|.|.|
           // |.|.|i|.|.|
           // |.|.|p|.|.|
           // attach p to i.
           if (y != 0){
             p.attach(this.points[x + (y - 1) * (parameters.cloth_width + 1)]);
             p.topConstraint = true;
           }

           this.points.push(p);
           sCloth.update(p,index);
       }
   }
};

// update the points in the cloth : COMPUTATION
Cloth.prototype.update = function () {
  //console.log('start update');
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
   //console.log('end update');
};

global.update = update;
function update() {
    cloth.update();
    return sCloth.points;
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},"/cloth_server_compact.js")
},{"fs":3,"msgpack-js-browser":2}],2:[function(require,module,exports){
( // Module boilerplate to support browser globals and browserify and AMD.
  typeof define === "function" ? function (m) { define("msgpack-js", m); } :
  typeof exports === "object" ? function (m) { module.exports = m(); } :
  function(m){ this.msgpack = m(); }
)(function () {
"use strict";

var exports = {};

exports.inspect = inspect;
function inspect(buffer) {
  if (buffer === undefined) return "undefined";
  var view;
  var type;
  if (buffer instanceof ArrayBuffer) {
    type = "ArrayBuffer";
    view = new DataView(buffer);
  }
  else if (buffer instanceof DataView) {
    type = "DataView";
    view = buffer;
  }
  if (!view) return JSON.stringify(buffer);
  var bytes = [];
  for (var i = 0; i < buffer.byteLength; i++) {
    if (i > 20) {
      bytes.push("...");
      break;
    }
    var byte = view.getUint8(i).toString(16);
    if (byte.length === 1) byte = "0" + byte;
    bytes.push(byte);
  }
  return "<" + type + " " + bytes.join(" ") + ">";
}

// Encode string as utf8 into dataview at offset
exports.utf8Write = utf8Write;
function utf8Write(view, offset, string) {
  var byteLength = view.byteLength;
  for(var i = 0, l = string.length; i < l; i++) {
    var codePoint = string.charCodeAt(i);

    // One byte of UTF-8
    if (codePoint < 0x80) {
      view.setUint8(offset++, codePoint >>> 0 & 0x7f | 0x00);
      continue;
    }

    // Two bytes of UTF-8
    if (codePoint < 0x800) {
      view.setUint8(offset++, codePoint >>> 6 & 0x1f | 0xc0);
      view.setUint8(offset++, codePoint >>> 0 & 0x3f | 0x80);
      continue;
    }

    // Three bytes of UTF-8.
    if (codePoint < 0x10000) {
      view.setUint8(offset++, codePoint >>> 12 & 0x0f | 0xe0);
      view.setUint8(offset++, codePoint >>> 6  & 0x3f | 0x80);
      view.setUint8(offset++, codePoint >>> 0  & 0x3f | 0x80);
      continue;
    }

    // Four bytes of UTF-8
    if (codePoint < 0x110000) {
      view.setUint8(offset++, codePoint >>> 18 & 0x07 | 0xf0);
      view.setUint8(offset++, codePoint >>> 12 & 0x3f | 0x80);
      view.setUint8(offset++, codePoint >>> 6  & 0x3f | 0x80);
      view.setUint8(offset++, codePoint >>> 0  & 0x3f | 0x80);
      continue;
    }
    throw new Error("bad codepoint " + codePoint);
  }
}

exports.utf8Read = utf8Read;
function utf8Read(view, offset, length) {
  var string = "";
  for (var i = offset, end = offset + length; i < end; i++) {
    var byte = view.getUint8(i);
    // One byte character
    if ((byte & 0x80) === 0x00) {
      string += String.fromCharCode(byte);
      continue;
    }
    // Two byte character
    if ((byte & 0xe0) === 0xc0) {
      string += String.fromCharCode(
        ((byte & 0x0f) << 6) |
        (view.getUint8(++i) & 0x3f)
      );
      continue;
    }
    // Three byte character
    if ((byte & 0xf0) === 0xe0) {
      string += String.fromCharCode(
        ((byte & 0x0f) << 12) |
        ((view.getUint8(++i) & 0x3f) << 6) |
        ((view.getUint8(++i) & 0x3f) << 0)
      );
      continue;
    }
    // Four byte character
    if ((byte & 0xf8) === 0xf0) {
      string += String.fromCharCode(
        ((byte & 0x07) << 18) |
        ((view.getUint8(++i) & 0x3f) << 12) |
        ((view.getUint8(++i) & 0x3f) << 6) |
        ((view.getUint8(++i) & 0x3f) << 0)
      );
      continue;
    }
    throw new Error("Invalid byte " + byte.toString(16));
  }
  return string;
}

exports.utf8ByteCount = utf8ByteCount;
function utf8ByteCount(string) {
  var count = 0;
  for(var i = 0, l = string.length; i < l; i++) {
    var codePoint = string.charCodeAt(i);
    if (codePoint < 0x80) {
      count += 1;
      continue;
    }
    if (codePoint < 0x800) {
      count += 2;
      continue;
    }
    if (codePoint < 0x10000) {
      count += 3;
      continue;
    }
    if (codePoint < 0x110000) {
      count += 4;
      continue;
    }
    throw new Error("bad codepoint " + codePoint);
  }
  return count;
}

exports.encode = function (value) {
  var buffer = new ArrayBuffer(sizeof(value));
  var view = new DataView(buffer);
  encode(value, view, 0);
  return buffer;
}

exports.decode = decode;

// http://wiki.msgpack.org/display/MSGPACK/Format+specification
// I've extended the protocol to have two new types that were previously reserved.
//   buffer 16  11011000  0xd8
//   buffer 32  11011001  0xd9
// These work just like raw16 and raw32 except they are node buffers instead of strings.
//
// Also I've added a type for `undefined`
//   undefined  11000100  0xc4

function Decoder(view, offset) {
  this.offset = offset || 0;
  this.view = view;
}
Decoder.prototype.map = function (length) {
  var value = {};
  for (var i = 0; i < length; i++) {
    var key = this.parse();
    value[key] = this.parse();
  }
  return value;
};
Decoder.prototype.buf = function (length) {
  var value = new ArrayBuffer(length);
  (new Uint8Array(value)).set(new Uint8Array(this.view.buffer, this.offset, length), 0);
  this.offset += length;
  return value;
};
Decoder.prototype.raw = function (length) {
  var value = utf8Read(this.view, this.offset, length);
  this.offset += length;
  return value;
};
Decoder.prototype.array = function (length) {
  var value = new Array(length);
  for (var i = 0; i < length; i++) {
    value[i] = this.parse();
  }
  return value;
};
Decoder.prototype.parse = function () {
  var type = this.view.getUint8(this.offset);
  var value, length;
  // FixRaw
  if ((type & 0xe0) === 0xa0) {
    length = type & 0x1f;
    this.offset++;
    return this.raw(length);
  }
  // FixMap
  if ((type & 0xf0) === 0x80) {
    length = type & 0x0f;
    this.offset++;
    return this.map(length);
  }
  // FixArray
  if ((type & 0xf0) === 0x90) {
    length = type & 0x0f;
    this.offset++;
    return this.array(length);
  }
  // Positive FixNum
  if ((type & 0x80) === 0x00) {
    this.offset++;
    return type;
  }
  // Negative Fixnum
  if ((type & 0xe0) === 0xe0) {
    value = this.view.getInt8(this.offset);
    this.offset++;
    return value;
  }
  switch (type) {
  // raw 16
  case 0xda:
    length = this.view.getUint16(this.offset + 1);
    this.offset += 3;
    return this.raw(length);
  // raw 32
  case 0xdb:
    length = this.view.getUint32(this.offset + 1);
    this.offset += 5;
    return this.raw(length);
  // nil
  case 0xc0:
    this.offset++;
    return null;
  // false
  case 0xc2:
    this.offset++;
    return false;
  // true
  case 0xc3:
    this.offset++;
    return true;
  // undefined
  case 0xc4:
    this.offset++;
    return undefined;
  // uint8
  case 0xcc:
    value = this.view.getUint8(this.offset + 1);
    this.offset += 2;
    return value;
  // uint 16
  case 0xcd:
    value = this.view.getUint16(this.offset + 1);
    this.offset += 3;
    return value;
  // uint 32
  case 0xce:
    value = this.view.getUint32(this.offset + 1);
    this.offset += 5;
    return value;
  // int 8
  case 0xd0:
    value = this.view.getInt8(this.offset + 1);
    this.offset += 2;
    return value;
  // int 16
  case 0xd1:
    value = this.view.getInt16(this.offset + 1);
    this.offset += 3;
    return value;
  // int 32
  case 0xd2:
    value = this.view.getInt32(this.offset + 1);
    this.offset += 5;
    return value;
  // map 16
  case 0xde:
    length = this.view.getUint16(this.offset + 1);
    this.offset += 3;
    return this.map(length);
  // map 32
  case 0xdf:
    length = this.view.getUint32(this.offset + 1);
    this.offset += 5;
    return this.map(length);
  // array 16
  case 0xdc:
    length = this.view.getUint16(this.offset + 1);
    this.offset += 3;
    return this.array(length);
  // array 32
  case 0xdd:
    length = this.view.getUint32(this.offset + 1);
    this.offset += 5;
    return this.array(length);
  // buffer 16
  case 0xd8:
    length = this.view.getUint16(this.offset + 1);
    this.offset += 3;
    return this.buf(length);
  // buffer 32
  case 0xd9:
    length = this.view.getUint32(this.offset + 1);
    this.offset += 5;
    return this.buf(length);
  // float
  case 0xca:
    value = this.view.getFloat32(this.offset + 1);
    this.offset += 5;
    return value;
  // double
  case 0xcb:
    value = this.view.getFloat64(this.offset + 1);
    this.offset += 9;
    return value;
  }
  throw new Error("Unknown type 0x" + type.toString(16));
};
function decode(buffer) {
  var view = new DataView(buffer);
  var decoder = new Decoder(view);
  var value = decoder.parse();
  if (decoder.offset !== buffer.byteLength) throw new Error((buffer.byteLength - decoder.offset) + " trailing bytes");
  return value;
}

function encode(value, view, offset) {
  var type = typeof value;

  // Strings Bytes
  if (type === "string") {
    var length = utf8ByteCount(value);
    // fix raw
    if (length < 0x20) {
      view.setUint8(offset, length | 0xa0);
      utf8Write(view, offset + 1, value);
      return 1 + length;
    }
    // raw 16
    if (length < 0x10000) {
      view.setUint8(offset, 0xda);
      view.setUint16(offset + 1, length);
      utf8Write(view, offset + 3, value);
      return 3 + length;
    }
    // raw 32
    if (length < 0x100000000) {
      view.setUint8(offset, 0xdb);
      view.setUint32(offset + 1, length);
      utf8Write(view, offset + 5, value);
      return 5 + length;
    }
  }

  if (value instanceof ArrayBuffer) {
    var length = value.byteLength;
    // buffer 16
    if (length < 0x10000) {
      view.setUint8(offset, 0xd8);
      view.setUint16(offset + 1, length);
      (new Uint8Array(view.buffer)).set(new Uint8Array(value), offset + 3);
      return 3 + length;
    }
    // buffer 32
    if (length < 0x100000000) {
      view.setUint8(offset, 0xd9);
      view.setUint32(offset + 1, length);
      (new Uint8Array(view.buffer)).set(new Uint8Array(value), offset + 5);
      return 5 + length;
    }
  }

  if (type === "number") {
    // Floating Point
    if ((value << 0) !== value) {
      view.setUint8(offset, 0xcb);
      view.setFloat64(offset + 1, value);
      return 9;
    }

    // Integers
    if (value >=0) {
      // positive fixnum
      if (value < 0x80) {
        view.setUint8(offset, value);
        return 1;
      }
      // uint 8
      if (value < 0x100) {
        view.setUint8(offset, 0xcc);
        view.setUint8(offset + 1, value);
        return 2;
      }
      // uint 16
      if (value < 0x10000) {
        view.setUint8(offset, 0xcd);
        view.setUint16(offset + 1, value);
        return 3;
      }
      // uint 32
      if (value < 0x100000000) {
        view.setUint8(offset, 0xce);
        view.setUint32(offset + 1, value);
        return 5;
      }
      throw new Error("Number too big 0x" + value.toString(16));
    }
    // negative fixnum
    if (value >= -0x20) {
      view.setInt8(offset, value);
      return 1;
    }
    // int 8
    if (value >= -0x80) {
      view.setUint8(offset, 0xd0);
      view.setInt8(offset + 1, value);
      return 2;
    }
    // int 16
    if (value >= -0x8000) {
      view.setUint8(offset, 0xd1);
      view.setInt16(offset + 1, value);
      return 3;
    }
    // int 32
    if (value >= -0x80000000) {
      view.setUint8(offset, 0xd2);
      view.setInt32(offset + 1, value);
      return 5;
    }
    throw new Error("Number too small -0x" + (-value).toString(16).substr(1));
  }

  // undefined
  if (type === "undefined") {
    view.setUint8(offset, 0xc4);
    return 1;
  }

  // null
  if (value === null) {
    view.setUint8(offset, 0xc0);
    return 1;
  }

  // Boolean
  if (type === "boolean") {
    view.setUint8(offset, value ? 0xc3 : 0xc2);
    return 1;
  }

  // Container Types
  if (type === "object") {
    var length, size = 0;
    var isArray = Array.isArray(value);

    if (isArray) {
      length = value.length;
    }
    else {
      var keys = Object.keys(value);
      length = keys.length;
    }

    var size;
    if (length < 0x10) {
      view.setUint8(offset, length | (isArray ? 0x90 : 0x80));
      size = 1;
    }
    else if (length < 0x10000) {
      view.setUint8(offset, isArray ? 0xdc : 0xde);
      view.setUint16(offset + 1, length);
      size = 3;
    }
    else if (length < 0x100000000) {
      view.setUint8(offset, isArray ? 0xdd : 0xdf);
      view.setUint32(offset + 1, length);
      size = 5;
    }

    if (isArray) {
      for (var i = 0; i < length; i++) {
        size += encode(value[i], view, offset + size);
      }
    }
    else {
      for (var i = 0; i < length; i++) {
        var key = keys[i];
        size += encode(key, view, offset + size);
        size += encode(value[key], view, offset + size);
      }
    }

    return size;
  }
  throw new Error("Unknown type " + type);
}

function sizeof(value) {
  var type = typeof value;

  // Raw Bytes
  if (type === "string") {
    var length = utf8ByteCount(value);
    if (length < 0x20) {
      return 1 + length;
    }
    if (length < 0x10000) {
      return 3 + length;
    }
    if (length < 0x100000000) {
      return 5 + length;
    }
  }

  if (value instanceof ArrayBuffer) {
    var length = value.byteLength;
    if (length < 0x10000) {
      return 3 + length;
    }
    if (length < 0x100000000) {
      return 5 + length;
    }
  }

  if (type === "number") {
    // Floating Point
    // double
    if (value << 0 !== value) return 9;

    // Integers
    if (value >=0) {
      // positive fixnum
      if (value < 0x80) return 1;
      // uint 8
      if (value < 0x100) return 2;
      // uint 16
      if (value < 0x10000) return 3;
      // uint 32
      if (value < 0x100000000) return 5;
      // uint 64
      if (value < 0x10000000000000000) return 9;
      throw new Error("Number too big 0x" + value.toString(16));
    }
    // negative fixnum
    if (value >= -0x20) return 1;
    // int 8
    if (value >= -0x80) return 2;
    // int 16
    if (value >= -0x8000) return 3;
    // int 32
    if (value >= -0x80000000) return 5;
    // int 64
    if (value >= -0x8000000000000000) return 9;
    throw new Error("Number too small -0x" + value.toString(16).substr(1));
  }

  // Boolean, null, undefined
  if (type === "boolean" || type === "undefined" || value === null) return 1;

  // Container Types
  if (type === "object") {
    var length, size = 0;
    if (Array.isArray(value)) {
      length = value.length;
      for (var i = 0; i < length; i++) {
        size += sizeof(value[i]);
      }
    }
    else {
      var keys = Object.keys(value);
      length = keys.length;
      for (var i = 0; i < length; i++) {
        var key = keys[i];
        size += sizeof(key) + sizeof(value[key]);
      }
    }
    if (length < 0x10) {
      return 1 + size;
    }
    if (length < 0x10000) {
      return 3 + size;
    }
    if (length < 0x100000000) {
      return 5 + size;
    }
    throw new Error("Array or object too long 0x" + length.toString(16));
  }
  throw new Error("Unknown type " + type);
}

return exports;

});

},{}],3:[function(require,module,exports){

},{}]},{},[1]);
