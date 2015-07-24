function dataPoints(){
  this.elatency = 0;
  this.nlatency = 0;
  this.fps = 0;
  this.counter = 1;
  this.elatencyStore = [];
  this.nlatencyStore = [];
  this.fpsStore = [];
  this.readings = 0;
}

dataPoints.prototype = {
  add : function(elatency, lfps){
    this.elatency += elatency;
    //this.nlatency += nlatency;
    if(lfps == "NaN")
      lfps = 0;
    this.fps += lfps;
    this.counter += 1;
  },

  average : function(){
    avE = (this.elatency/this.counter).toFixed(2);
    avF = (this.fps/this.counter).toFixed(2);

    // do not store 0 readings
    if(avE == 0 && avF == 0)
      return;

    this.elatencyStore.push(avE);
    this.elatency = 0;

    this.fpsStore.push(avF);
    this.fps = 0.0;

    r = Math.round(this.nlatency/this.counter);
    this.nlatencyStore.push(r);
    this.nlatency = 0;
    this.readings++;
    this.counter = 1;

  },

  getReadings : function(){
    return this.readings;
  },

  reset : function(){
    this.elatency = 0;
    this.nlatency = 0;
    this.fps = 0;
    this.counter = 1;
    this.elatencyStore = [];
    this.nlatencyStore = [];
    this.fpsStore = [];
    this.readings = 0;
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

  getCounter : function(){
    return this.counter;
  }
}

