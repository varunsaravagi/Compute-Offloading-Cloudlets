function dataPoints(){
  this.elatency = 0;
  this.nlatency = 0;
  this.fps = 0.0;
  this.bandwidth = 0;
  this.counter = 1;
  this.elatencyStore = [];
  this.nlatencyStore = [];
  this.fpsStore = [];
  this.bandwidthStore = [];
}

dataPoints.prototype = {
  add : function(elatency, fps){
    this.elatency += elatency;
    //this.nlatency += nlatency;
    //this.bandwidth += bandwidth;
    this.fps += fps;
    this.elatencyStore.push(elatency);
    this.fpsStore.push(fps);
    this.counter += 1;
  },

  avElatency : function(){
    r = (this.elatency/this.counter).toFixed(2);
    this.elatencyStore.push(r);
    return r;
  },

  avNlatency : function(){
    r = Math.round(this.nlatency/this.counter);
    this.nlatencyStore.push(r);
    return r;
  },

  avFps : function(){
    r = (this.fps/this.counter).toFixed(2);
    this.fpsStore.push(r);
    return r;
  },

  avBandwidth : function(){
    r = Math.round(this.bandwidth/this.counter);
    this.bandwidthStore.push(r);
    return r;
  },

  reset : function(){
    this.elatency = 0;
    this.nlatency = 0;
    this.fps = 0;
    this.bandwidth = 0;
    this.counter = 1;
    this.elatencyStore = [];
    this.nlatencyStore = [];
    this.fpsStore = [];
    this.bandwidthStore = [];
  },

  getSElatency : function(){
    return this.elatencyStore;
  },

  getSNlatency : function(){
    return this.nlatencyStore;
  },

  getSFps : function(){
    return this.fpsStore;
  },

  getSBandwidth : function(){
    return this.bandwidthStore;
  },

  getCounter : function(){
    return this.counter;
  }
}
