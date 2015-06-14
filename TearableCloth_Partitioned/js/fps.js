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
		this.counter += 1;
		this.fpsAverage += Math.round(1/this.elapsed);
		return Math.round(1/this.elapsed);
	},

	fpsAv: function(){
		return Math.round(this.fpsAverage/this.counter);
	}
}