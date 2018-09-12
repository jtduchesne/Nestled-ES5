(function(Nestled, undefined) {
    "use strict";
    /*
    Output properties:
      source => Canvas object
    */
    function Output(source) {
        if (!source)
            console.error("Nestled: Output needs a source canvas.");
        else if (!(source.nodeName === "CANVAS"))
            console.error("Nestled: Output's source must be a <CANVAS>.");
        this.source = source;
        this.nextUpdate = -1;
    }

    Output.prototype = {
        constructor: Output,
        
        requestUpdate: function() {
            this.nextUpdate = this.nextUpdate || window.requestAnimationFrame(this.update.bind(this));
        },
        
        //===============================================================//
        
        attach: function(outputCanvas) {
            this.canvas = outputCanvas;
            this.context = outputCanvas.getContext('2d', {alpha: false});
            
            this.context.imageSmoothingEnabled = false;
            
            this.update();
        },
        detach: function() {
            this.clear();
            this.nextUpdate = -1;
        },
        update: function() {
            if (this.context) {
                this.context.drawImage(this.source, 0, 0, this.canvas.width, this.canvas.height);
                this.nextUpdate = 0;
            } else
                this.nextUpdate = -1;
        },
        clear: function() {
            if (this.context) {
                this.context.beginPath();
                this.context.rect(0, 0, this.canvas.width, this.canvas.height);
                this.context.fill();
            }
        },
    };

    Nestled.Output = Output;
})(window.Nestled = window.Nestled || {});