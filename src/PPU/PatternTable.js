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
            for (var index=0; index<256; index++)
                this.renderPattern(index);
            this.context.putImageData(this.imageData, 0, 0);
        },
        renderPattern: function(index, paletteIndex) {
            var x, y;
            var bit0, bit1;
            var dataAddress = this.baseAddress + (index*16);
            var shift;
            var color, pixel;
            
            var readData = this.ppu.readData.bind(this.ppu);
            var pixels = this.pixels;
            var palette = this.palette;
            if (paletteIndex === undefined) {
                paletteIndex = 0;
                palette = this.greyPalette;
            }
            
            var tileX = (index&0x0F)<<3;
            var tileY = (index&0xF0)>>1;
            for (var fineY=0; fineY<8; fineY++) {
                y = tileY+fineY;
                
                bit0 = readData(dataAddress+fineY);
                bit1 = readData(dataAddress+fineY+8);
                
                for (var fineX=0; fineX<8; fineX++) {
                    x = tileX+fineX;
                    
                    shift = fineX^0x7;
                    color = ((bit0>>shift)&0x1) | ((bit1>>shift)&0x1)<<1;
                    
                    pixels.setUint32((y*128 + x)*4, palette.getColor(paletteIndex, color));
                }
            }
            
            this.output.requestUpdate();
        },
        
        getPattern: function(patternIndex, paletteIndex) {
            this.renderPattern(patternIndex, paletteIndex);
            this.context.putImageData(this.imageData, 0, 0);
            
            return this.context.getImageData((patternIndex&0x0F)<<3, (patternIndex>>4)<<3, 8, 8);
        },
    };

    Nestled.PatternTable = PatternTable;
})(window.Nestled = window.Nestled || {});