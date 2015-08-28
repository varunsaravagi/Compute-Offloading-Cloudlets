function timer() {
	this.elapsed = 0
	this.last = null
	this.fpsAverage = 0
	this.counter = 0
}

timer.prototype = {
	tick: function(now){
		this.elapsed = (now -(this.last || now))/1000;
		this.last = now;
	},

	fps: function(){
		return parseFloat((1/this.elapsed).toFixed(2));
	},

	fpsAv: function(){
		return Math.round(this.fpsAverage/this.counter);
	},

	reset: function(){
		this.elapsed = 0
		this.last = null
		this.fpsAverage = 0
		this.counter = 0
	}
}
