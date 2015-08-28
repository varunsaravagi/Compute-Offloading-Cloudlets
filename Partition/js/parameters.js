/*
 This file is not being used anywhere.
 It only contains the parameters which are being used to generate the reading sets.
*/

function simulation(){
  this.counter = 0;
}

simulation.prototype = {
  next : function(){
    if(this.counter == 31)
      return -1;
    return p[this.counter++];
  }
}

function setParams(p, h, w){
  // p-> physics accuracy
  // h-> cloth height
  // w-> cloth width
  var params = {
    physics : p,
    cloth_height : h,
    cloth_width : w
  };

  return params;
}

var p = [];
// numbers (if present) at the end of each line represents the data size the cloth
// of the said dimension takes.
// -> First entry corresponds to serialization logic in file ../cloth_server_diffser.js
// -> Second entry corresponds to serialization logic in file ../cloth_server_compact.js
p.push(setParams(5,80,90)); 103143 | 33837 
p.push(setParams(15,80,90)); //only physics
p.push(setParams(25,80,90));
p.push(setParams(35,80,90));
p.push(setParams(45,80,90));
p.push(setParams(55,80,90));
p.push(setParams(65,80,90));
p.push(setParams(75,80,90));
p.push(setParams(85,80,90));
p.push(setParams(95,80,90));
p.push(setParams(105,80,90));
p.push(setParams(5,80,180)); 205257 //increasing data size, computation also increases
p.push(setParams(5,120,182)); 310005 | 111889
p.push(setParams(5,135,215)); 411267
p.push(setParams(5,150,244)); 516725 | 192673
p.push(setParams(5,180,244)); 619385
p.push(setParams(5,210,244)); 722045 | 280393
p.push(setParams(5,235,250)); 827557
p.push(setParams(5,260,245)); 926291 | 354943
p.push(setParams(5,290,260)); 1095683
p.push(setParams(5,317,260)); 1193081 | 462980
p.push(setParams(15,80,180)); //both physics and data
p.push(setParams(25,120,182));
p.push(setParams(35,135,215));
p.push(setParams(45,150,244));
p.push(setParams(55,180,244));
p.push(setParams(65,210,244));
p.push(setParams(75,235,250));
p.push(setParams(85,260,245));
p.push(setParams(95,290,260));
p.push(setParams(105,317,260));
