(function(Nestled, undefined) {
    "use strict";
    /*
    Colors properties:
      output  => Canvas object
    */
    function Colors(opts) {
        this.initCanvas(16, 4);
        
        var pixels = this.pixels;
        for (var i=0; i<64; i++) { //Hardcoded to NTSC for now...
            pixels.setUint8(i*4+0, this.NTSC[i*3+0]);
            pixels.setUint8(i*4+1, this.NTSC[i*3+1]);
            pixels.setUint8(i*4+2, this.NTSC[i*3+2]);
            pixels.setUint8(i*4+3, 0xFF);
        }
        this.context.putImageData(this.imageData,0,0);
        
        if (opts && opts['output'])
            this.attachOutput(opts['output']);
        else
            this.detachOutput();
        
        this.getPixel = function(index) { return pixels.getUint32((index%64)*4); };
        this.getR = function(index) { return pixels.getUint8(index*4+0); };
        this.getG = function(index) { return pixels.getUint8(index*4+1); };
        this.getB = function(index) { return pixels.getUint8(index*4+2); };
    }

    Colors.prototype = {
        constructor: Colors,
        
        canvas: document.createElement('canvas'),
        initCanvas: function(width, height) {
            this.canvas.width = width;
            this.canvas.height = height;
            
            this.context = this.canvas.getContext('2d', {alpha: false});
            this.imageData = this.context.createImageData(width, height);
            this.pixels = new DataView(this.imageData.data.buffer);
        },
        
        //===============================================================//
        
        NTSC: new Uint8Array([0x54,0x54,0x54, 0x00,0x1E,0x74, 0x08,0x10,0x90, 0x30,0x00,0x88, 0x44,0x00,0x64, 0x5C,0x00,0x30, 0x54,0x04,0x00, 0x3C,0x18,0x00, 
                              0x20,0x2A,0x00, 0x08,0x3A,0x00, 0x00,0x40,0x00, 0x00,0x3C,0x00, 0x00,0x32,0x3C, 0x00,0x00,0x00, 0x00,0x00,0x00, 0x00,0x00,0x00, 
                              0x98,0x96,0x98, 0x08,0x4C,0xC4, 0x30,0x32,0xEC, 0x5C,0x1E,0xE4, 0x88,0x14,0xB0, 0xA0,0x14,0x64, 0x98,0x22,0x20, 0x78,0x3C,0x00, 
                              0x54,0x5A,0x00, 0x28,0x72,0x00, 0x08,0x7C,0x00, 0x00,0x76,0x28, 0x00,0x66,0x78, 0x00,0x00,0x00, 0x00,0x00,0x00, 0x00,0x00,0x00, 
                              0xEC,0xEE,0xEC, 0x4C,0x9A,0xEC, 0x78,0x7C,0xEC, 0xB0,0x62,0xEC, 0xE4,0x54,0xEC, 0xEC,0x58,0xB4, 0xEC,0x6A,0x64, 0xD4,0x88,0x20, 
                              0xA0,0xAA,0x00, 0x74,0xC4,0x00, 0x4C,0xD0,0x20, 0x38,0xCC,0x6C, 0x38,0xB4,0xCC, 0x3C,0x3C,0x3C, 0x00,0x00,0x00, 0x00,0x00,0x00, 
                              0xEC,0xEE,0xEC, 0xA8,0xCC,0xEC, 0xBC,0xBC,0xEC, 0xD4,0xB2,0xEC, 0xEC,0xAE,0xEC, 0xEC,0xAE,0xD4, 0xEC,0xB4,0xB0, 0xE4,0xC4,0x90, 
                              0xCC,0xD2,0x78, 0xB4,0xDE,0x78, 0xA8,0xE2,0x90, 0x98,0xE2,0xB4, 0xA0,0xD6,0xE4, 0xA0,0xA2,0xA0, 0x00,0x00,0x00, 0x00,0x00,0x00]),
        
        //===============================================================//
        
        attachOutput: function(output) {
            this.output = output;
            this.outputContext = this.output.getContext('2d', {alpha: false});
            
            this.outputContext.imageSmoothingEnabled = false;
            
            this.updateOutput();
        },
        detachOutput: function() {
            this.clearOutput();
        },
        updateOutput: function() {
            if (this.outputContext)
                this.outputContext.drawImage(this.canvas, 0, 0, 14, 4, 0, 0, this.output.width, this.output.height);
        },
        clearOutput: function() {
            if (this.outputContext) {
                this.outputContext.beginPath();
                this.outputContext.rect(0, 0, this.output.width, this.output.height);
                this.outputContext.fill();
            }
        }
    };

    Nestled.Colors = Colors;
})(window.Nestled = window.Nestled || {});