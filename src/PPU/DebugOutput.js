(function(Nestled, undefined) {
    "use strict";
    /*
    DebugOutput properties:
      width  => Integer (in pixels)
      height => Integer (in pixels)
    */
    function DebugOutput(width, height) {
        this.buffer = document.createElement('canvas');
        this.buffer.width = width;
        this.buffer.height = height;
        
        this.context = this.buffer.getContext('2d', {alpha: false});
        
        this.imageData = this.context.createImageData(width, height);
        this.pixels = new DataView(this.imageData.data.buffer);
        
        this.nextUpdate = -1;
    }
    
    DebugOutput.prototype = {
        constructor: DebugOutput,
        
        setPixel: function(offset, rgbaValue) {
            this.pixels.setUint32(offset*4, rgbaValue);
        },
        
        requestUpdate: function() {
            if (this.nextUpdate == 0)
                this.nextUpdate = window.requestAnimationFrame(this.update.bind(this));
        },
        
        //===============================================================//
        
        attach: function(outputCanvas) {
            this.output = outputCanvas;
            
            this.outputContext = this.output.getContext('2d', {alpha: false});
            this.outputContext.imageSmoothingEnabled = false;
            
            this.update();
        },
        detach: function() {
            this.clear();
            this.nextUpdate = -1;
        },
        update: function() {
            this.context.putImageData(this.imageData, 0, 0);
            this.outputContext.drawImage(this.buffer, 0, 0, this.output.width, this.output.height);
            this.nextUpdate = 0;
        },
        clear: function() {
            this.outputContext.beginPath();
            this.outputContext.rect(0, 0, this.output.width, this.output.height);
            this.outputContext.fill();
        },
    };

    Nestled.DebugOutput = DebugOutput;
})(window.Nestled = window.Nestled || {});