"use strict";

(function(Nestled, undefined) {
    /*
    Counter properties:
      expectedFrameTime => Integer
    */
    function Counter(opts) {
        var expectedFrameTime = opts['expectedFrameTime'];
        
        this.fps = Math.round(1000.0/expectedFrameTime);
        this.emulationSpeed = 0.0;
        
        var maxFrameTime = this.maxFrameTime;
        var averageDuration = 0.0;
        var lastFrameTime = 0.0;
        var lastLoopTime = 0.0;
        
        this.init = function(startTime) {
            return lastFrameTime = lastLoopTime = startTime;
        }
        this.start = function(startTime) {
            return Math.min(1000, startTime - lastLoopTime);
        };
        this.step = function(startTime) {
            averageDuration += (startTime-lastFrameTime-averageDuration)/10;
            
            this.fps = 1000.0/averageDuration;
            this.emulationSpeed = (expectedFrameTime/(window.performance.now() - startTime))*100;
            
            return lastFrameTime = startTime;
        };
        this.loop = function(startTime) {
            return lastLoopTime = startTime;
        };
        this.reset = function() {
            averageDuration = 0.0;
            this.fps = Math.round(1000.0/expectedFrameTime);
            this.emulationSpeed = 0.0;
        };
    }

    Counter.prototype.constructor = Counter;

    Nestled.Counter = Counter;
})(window.Nestled = window.Nestled || {});