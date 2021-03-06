(function(Nestled, undefined) {
    "use strict";
    /*
    Palette properties:
      palettesCount => Integer (Default: 4)
      colorsCount   => Integer (Default: 4)
    */
    function Palette(opts) {
        this.palettesCount = (opts && opts['palettesCount']) || 4;
        this.colorsCount = (opts && opts['colorsCount']) || 4;
        
        this.colors = this.NTSC; //Hardcoded to NTSC for now...
        
        this.data = new Uint8Array(this.colorsCount*this.palettesCount);
        
        this.output = new Nestled.DebugOutput(this.colorsCount, this.palettesCount);
    }

    Palette.prototype = {
        constructor: Palette,
        
        getColor: function(paletteIndex, colorIndex) {
            return this.colors[this.getByte(paletteIndex, colorIndex)];
        },
        
        getByte: function(paletteIndex, colorIndex) {
            return this.data[paletteIndex*this.colorsCount + colorIndex];
        },
        setByte: function(paletteIndex, colorIndex, value) {
            var offset = paletteIndex*this.colorsCount + colorIndex;
            this.data[offset] = value;
            
            this.output.setPixel(offset, this.colors[value]);
            this.output.requestUpdate();
        },
        
        //===============================================================//
        
        NTSC: new Uint32Array([0x545454FF, 0x001E74FF, 0x081090FF, 0x300088FF, 0x440064FF, 0x5C0030FF, 0x540400FF, 0x3C1800FF, 
                               0x202A00FF, 0x083A00FF, 0x004000FF, 0x003C00FF, 0x00323CFF, 0x000000FF, 0x000000FF, 0x000000FF, 
                               0x989698FF, 0x084CC4FF, 0x3032ECFF, 0x5C1EE4FF, 0x8814B0FF, 0xA01464FF, 0x982220FF, 0x783C00FF, 
                               0x545A00FF, 0x287200FF, 0x087C00FF, 0x007628FF, 0x006678FF, 0x000000FF, 0x000000FF, 0x000000FF, 
                               0xECEEECFF, 0x4C9AECFF, 0x787CECFF, 0xB062ECFF, 0xE454ECFF, 0xEC58B4FF, 0xEC6A64FF, 0xD48820FF, 
                               0xA0AA00FF, 0x74C400FF, 0x4CD020FF, 0x38CC6CFF, 0x38B4CCFF, 0x3C3C3CFF, 0x000000FF, 0x000000FF, 
                               0xECEEECFF, 0xA8CCECFF, 0xBCBCECFF, 0xD4B2ECFF, 0xECAEECFF, 0xECAED4FF, 0xECB4B0FF, 0xE4C490FF, 
                               0xCCD278FF, 0xB4DE78FF, 0xA8E290FF, 0x98E2B4FF, 0xA0D6E4FF, 0xA0A2A0FF, 0x000000FF, 0x000000FF]),
    };

    Nestled.Palette = Palette;
})(window.Nestled = window.Nestled || {});