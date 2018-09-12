(function(Nestled, undefined) {
    "use strict";
    /*
    PatternTable properties:
      ppu => Nestled.Ppu
      baseAddress => [0x0000, 0x1000]
      palette => Nestled.Palette
    */
    function PatternTable(ppu, baseAddress, opts) {
        this.ppu = ppu;
        this.baseAddress = baseAddress;
        
        this.palette = (opts && opts['palette']) || this.greyPalette;
        
        this.initCanvas(128, 128);
        this.output = new Nestled.Output(this.canvas);
    }

    PatternTable.prototype = {
        constructor: PatternTable,
        
        initCanvas: function(width, height) {
            this.canvas = document.createElement('canvas');
            this.canvas.width = width;
            this.canvas.height = height;
            
            this.context = this.canvas.getContext('2d', {alpha: false});
            this.imageData = this.context.createImageData(width, height);
            this.pixels = new DataView(this.imageData.data.buffer);
        },
        
        greyPalette: (function() {
            var palette = new Nestled.Palette({palettesCount: 1});
            palette.setByte(0, 0, 0x0F); //Black
            palette.setByte(0, 3, 0x00); //Dark gray
            palette.setByte(0, 2, 0x10); //Light gray
            palette.setByte(0, 1, 0x20); //White
            return palette;
        })(),
        
        //===============================================================//
        
        renderAllPatterns: function() {
            for (var tileX=0; tileX<16; tileX++)
                for (var tileY=0; tileY<16; tileY++)
                    this.renderPattern(tileX, tileY);
            this.context.putImageData(this.imageData, 0, 0);
        },
        renderPattern: function(tileX, tileY) {
            var x, y;
            var bit0, bit1;
            var dataAddress = this.baseAddress + ((tileY*16)+tileX)*16;
            var shift;
            var color, pixel;
            for (var fineY=0; fineY<8; fineY++) {
                y = tileY*8+fineY;
                bit0 = this.ppu.readData(dataAddress+fineY);
                bit1 = this.ppu.readData(dataAddress+fineY+8);
                
                for (var fineX=0; fineX<8; fineX++) {
                    x = tileX*8+fineX;
                    shift = fineX^0x7;
                    color = ((bit0>>shift)&0x1) | ((bit1>>shift)&0x1)<<1;
                    pixel = this.palette.getPixel(0, color).toString(16);
                    this.pixels.setUint32((y*128 + x)*4, this.palette.getPixel(0, color));
                }
            }
            this.output.requestUpdate();
        },
    };

    Nestled.PatternTable = PatternTable;
})(window.Nestled = window.Nestled || {});