"use strict";

(function(Nestled, undefined) {
    /*
    Palette properties:
      colors => Nestled.Colors
      palettesCount => Integer (Default: 4)
      colorsCount   => Integer (Default: 4)
      output => Canvas object
    */
    function Palette(opts) {
        this.palettesCount = (opts && opts['palettesCount']) || 4;
        this.colorsCount = (opts && opts['colorsCount']) || 4;
        this.initCanvas();
        
        this.context = this.canvas.getContext('2d');
        this.imageData = this.context.createImageData(this.colorsCount, this.palettesCount);
        this.pixels = new DataView(this.imageData.data.buffer);
        
        this.data = new Uint8Array(this.colorsCount*this.palettesCount);
        this.colors = (opts && opts['colors']) || new Nestled.Colors;
        
        if (opts && opts['output'])
            this.attachOutput(opts['output']);
        else
            this.detachOutput();
    }

    Palette.prototype = {
        constructor: Palette,
        
        initCanvas: function() {
            this.canvas = document.createElement('canvas');
            this.canvas.width = this.colorsCount;
            this.canvas.height = this.palettesCount;
        },
        
        //===============================================================//
        
        getByte: function(paletteIndex, colorIndex) {
            return this.data[paletteIndex*this.colorsCount + colorIndex];
        },
        setByte: function(paletteIndex, colorIndex, value) {
            var offset = paletteIndex*this.colorsCount + colorIndex;
            this.data[offset] = value;
            
            this.pixels.setUint32(offset*4, this.colors.getPixel(value), true);
            this.context.putImageData(this.imageData, 0, 0);
            this.nextUpdate = this.nextUpdate || window.requestAnimationFrame(this.updateOutput.bind(this));
        },
        
        //Helper function mainly for setting up tests...
        setBytes: function(offset, values) {
            var max = this.colorsCount*this.palettesCount;
            var end = (offset+values.length > max) ? max-offset : values.length;
            for (var i=0; i<end; i++) {
                this.data[offset+i] = values[i];
                this.pixels[offset+i] = this.colors.getPixel(values[i]);
            }
            this.context.putImageData(this.imageData,0,0);
        },
        
        //===============================================================//
        
        attachOutput: function(output) {
            this.output = output;
            this.outputContext = this.output.getContext('2d');
            
            this.outputContext.imageSmoothingEnabled = false;
            
            this.updateOutput();
        },
        detachOutput: function() {
            this.clearOutput();
            this.nextUpdate = -1;
        },
        updateOutput: function() {
            if (this.outputContext) {
                this.outputContext.drawImage(this.canvas, 0, 0, this.output.width, this.output.height);
                this.nextUpdate = 0;
            } else
                this.nextUpdate = -1;
        },
        clearOutput: function() {
            if (this.outputContext) {
                this.outputContext.beginPath();
                this.outputContext.rect(0, 0, this.output.width, this.output.height);
                this.outputContext.fill();
            }
        }
    }

    Nestled.Palette = Palette;
})(window.Nestled = window.Nestled || {});