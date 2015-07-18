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
  var params = {
    physics : p,
    cloth_height : h,
    cloth_width : w
  };

  return params;
}

var p = [];
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
p.push(setParams(5,120,182)); 310005
p.push(setParams(5,135,215)); 411267
p.push(setParams(5,150,244)); 516725
p.push(setParams(5,180,244)); 619385
p.push(setParams(5,210,244)); 722045
p.push(setParams(5,235,250)); 827557
p.push(setParams(5,260,245)); 926291
p.push(setParams(5,290,260)); 1095683
p.push(setParams(5,317,260)); 1193081
p.push(setParams(15,80,180)); //both physics and data
p.push(setParams(25,120,182));
p.push(setParams(35,135,215));
p.push(setParams(45,150,244));
p.push(setParams(55,180,244));
p.push(setParams(65,210,244));
p.push(setParams(75,235,250));
