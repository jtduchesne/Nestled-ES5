(function(Nestled, undefined) {
    "use strict";
    /*
    OAM properties:
      ppu => Nestled.Ppu
    */
    function OAM(ppu, opts) {
        this.ppu = ppu;
        
        this.data = new Uint8Array(64*4);
        this.dirty = [];
        
        this.output = new Nestled.DebugOutput(64, 64);
    }

    OAM.prototype = {
        constructor: OAM,
        
        getByte: function(address) {
            return this.data[address];
        },
        setByte: function(address, data) {
            this.data[address] = data;
            this.dirty[address>>2] = true;
        },
        
        renderSprites: function(renderAll) {
            if (renderAll) {
                for (var index=0; index<64; index++)
                    this.renderSprite(index);
            } else {
                this.dirty.forEach(function(element, index) {
                    this.renderSprite(index);
                }, this);
            }
            this.dirty = [];
        },
        renderSprite: function(index) {
            var posY         = this.data[index*4 + 0];
            var patternIndex = this.data[index*4 + 1];
            var attributes   = this.data[index*4 + 2];
            var posX         = this.data[index*4 + 3];
            
            var paletteIndex = attributes & 0x3;
            var priority = attributes & 0x20;
            var flipHorizontally = attributes & 0x40;
            var flipVertically = attributes & 0x80;
            
            this.output.context.putImageData(this.ppu.sprPatternTable.getPattern(patternIndex, paletteIndex),
                                             index&0x38, (index&0x07)<<3);
            
            this.output.requestUpdate();
        },
    };

    Nestled.OAM = OAM;
})(window.Nestled = window.Nestled || {});