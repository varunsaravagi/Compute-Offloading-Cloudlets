function dataPoints(){
  this.elatency = 0,
  this.nlatency = 0,
  this.fps = 0,
  this.bandwidth = 0,
  this.counter = 1
}

dataPoints.prototype = {
  add : function(elatency, nlatency, fps, bandwidth){
    this.elatency += elatency;
    this.nlatency += nlatency;
    this.bandwidth += bandwidth;
    this.fps += fps;
    this.counter += 1;
  },

  avElatency : function(){
    return Math.round(this.elatency/this.counter);
  },

  avNlatency : function(){
    return Math.round(this.nlatency/this.counter);
  },

  avFps : function(){
    return Math.round(this.fps/this.counter);
  },

  avBandwidth : function(){
    return Math.round(this.bandwidth/this.counter);
  },

  reset : function(){
    this.elatency = 0;
    this.nlatency = 0;
    this.fps = 0;
    this.bandwidth = 0;
    this.counter = 1;
  }
}
