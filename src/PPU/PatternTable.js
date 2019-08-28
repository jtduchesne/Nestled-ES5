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
        
        this.output = new Nestled.DebugOutput(128, 128);
    }

    PatternTable.prototype = {
        constructor: PatternTable,
        
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
        },
        renderPattern: function(index, paletteIndex) {
            var x, y;
            var bit0, bit1;
            var dataAddress = this.baseAddress + (index*16);
            var shift;
            var color, pixel;
            
            var readData = this.ppu.readData.bind(this.ppu);
            var setPixel = this.output.setPixel.bind(this.output);
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
                    
                    setPixel(y*128 + x, palette.getColor(paletteIndex, color));
                }
            }
            
            this.output.requestUpdate();
        },
        
        getPattern: function(patternIndex, paletteIndex) {
            this.renderPattern(patternIndex, paletteIndex);
            this.output.update();
            
            return this.output.context.getImageData((patternIndex&0x0F)<<3, (patternIndex>>4)<<3, 8, 8);
        },
    };

    Nestled.PatternTable = PatternTable;
})(window.Nestled = window.Nestled || {});