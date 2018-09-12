(function(Nestled, undefined) {
    "use strict";
    /*
    Palette properties:
      palettesCount => Integer (Default: 4)
      colorsCount   => Integer (Default: 4)
      colors => Nestled.Colors
    */
    function Palette(opts) {
        this.palettesCount = (opts && opts['palettesCount']) || 4;
        this.colorsCount = (opts && opts['colorsCount']) || 4;
        this.colors = (opts && opts['colors']) || new Nestled.Colors;
        
        this.data = new Uint8Array(this.colorsCount*this.palettesCount);
        
        this.initCanvas(this.colorsCount, this.palettesCount);
        this.output = new Nestled.Output(this.canvas);
    }

    Palette.prototype = {
        constructor: Palette,
        
        initCanvas: function(width, height) {
            this.canvas = document.createElement('canvas');
            this.canvas.width = width;
            this.canvas.height = height;
            
            this.context = this.canvas.getContext('2d', {alpha: false});
            this.imageData = this.context.createImageData(width, height);
            this.pixels = new DataView(this.imageData.data.buffer);
        },
        
        //===============================================================//
        
        getPixel: function(paletteIndex, colorIndex) {
            return this.pixels.getUint32((paletteIndex*this.colorsCount + colorIndex)*4);
        },
        
        getByte: function(paletteIndex, colorIndex) {
            return this.data[paletteIndex*this.colorsCount + colorIndex];
        },
        setByte: function(paletteIndex, colorIndex, value) {
            var offset = paletteIndex*this.colorsCount + colorIndex;
            this.data[offset] = value;
            
            this.pixels.setUint32(offset*4, this.colors.getPixel(value));
            this.context.putImageData(this.imageData, 0, 0);
            
            this.output.requestUpdate();
        },
        
        //Helper function mainly for setting up tests...
        setBytes: function(offset, values) {
            var max = this.colorsCount*this.palettesCount;
            var end = (offset+values.length > max) ? max-offset : values.length;
            for (var i=0; i<end; i++) {
                this.data[offset+i] = values[i];
                this.pixels.setUint32((offset+i)*4, this.colors.getPixel(values[i]));
            }
            this.context.putImageData(this.imageData,0,0);
        },
    };

    Nestled.Palette = Palette;
})(window.Nestled = window.Nestled || {});