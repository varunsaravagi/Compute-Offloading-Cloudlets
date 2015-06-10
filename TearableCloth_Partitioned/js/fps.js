function timer() {
	this.elapsed = 0
	this.last = null
}

timer.prototype = {
	tick: function(now){
		this.elapsed = (now -(this.last || now))/1000;
		this.last = now;
	},

	fps: function(){
		return Math.round(1/this.elapsed)
	}
}