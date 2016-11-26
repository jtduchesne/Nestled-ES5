"use strict";

(function(Nestled, undefined) {
    /*
    Ppu properties:
      nes => Nestled.Nes
    */
    function Ppu(nes) {
        this.bus = nes;
        
        //Internal Video RAM (or Character Internal RAM)
        this.vram = [new Array(0x400), new Array(0x400)];
        //Object Attribute Memory
        this.oam = new Array(0x100);
        
        //Palettes
        this.backgroundPalette = [new Array(4), new Array(4), new Array(4), new Array(4)];
        this.spritesPalette = [new Array(4), new Array(4), new Array(4), new Array(4)];
        this.colors = new Nestled.Colors;
            
        this.powerOff();
        
        this.ntsc = true; //Hardcoded to NTSC for now...
        this.pal = false;
        this.dendy = false;
    }

    Ppu.prototype = {
        constructor: Ppu,
        
        powerOn:  function() {
            this.isPowered = true;
        },
        powerOff: function() {
            this.clearReadBuffer();    //$2007 Data Register
            this.clearAddressBuffer(); //$2006 Address Register
            
            //$2000 Control Register
            this.clearControlRegister();
            
            //$2001 Mask Register
            this.clearMaskRegister();
            
            //$2002 Status Register
            this.clearSpriteOverflow();
            this.clearSprite0Hit();
            this.clearVBlank();
            
            //$2003 OAM Address
            this.oamAddress = 0x00;
            
            //$2005 Scroll Register
            this.clearScroll();
            
            this.isPowered = false;
        },
        
        reset: function() {
            this.clearReadBuffer();
            this.clearControlRegister();
            this.clearMaskRegister();
            this.clearScroll();
        },
        
        clearControlRegister: function() {
            this.baseNametableAddress = 0x2000;     //[0x2000,0x2400,0x2800,0x2C00]
            this.addToXScroll = 0;                  //[0,256]
            this.addToYScroll = 0;                  //[0,240]
            this.addressIncrement = 1;              //[1,32]
            this.spritePatternTableAddress = 0;     //[0x0000,0x1000]
            this.backgroundPatternTableAddress = 0; //[0x0000,0x1000]
            this.sprite8x16 = 0;
            this.nmiEnabled = 0;
        },
        
        clearMaskRegister: function() {
            this.grayscale = 0;
            this.showLeftMostBackground = 0;
            this.showLeftMostSprites = 0;
            this.showBackground = 0;
            this.showSprites = 0;
            this.emphasisRed = 0;
            this.emphasisGreen = 0;
            this.emphasisBlue = 0;
        },
        
        setSpriteOverflow: function() { this.spriteOverflow = 0x20; },
        setSprite0Hit:     function() { this.sprite0Hit = 0x40; },
        setVBlank:         function() { this.vblank = 0x80; },
        clearSpriteOverflow: function() { this.spriteOverflow = 0x00; },
        clearSprite0Hit:     function() { this.sprite0Hit = 0x00; },
        clearVBlank:         function() { this.vblank = 0x00; },
        
        clearScroll: function() {
            this.addressToggle = false;
            this.scrollX = 0x00;
            this.scrollY = 0x00;
        },
        
        clearAddressBuffer: function() {
            this.addressToggle = false;
            this.addressBuffer = 0x0000;
        },
        clearReadBuffer: function() {
            this.readBuffer = 0x00;
        },
        
        //== Rendering ==================================================//
        renderFrame: function() {
            
        },
        
        //== I/O access =================================================//
        read: function(address) {
            var returnValue;
            switch (address&0x7) {
            case 0x2: //$2002 Status Register
                returnValue = this.spriteOverflow + this.sprite0Hit + this.vblank;
                
                this.clearVBlank();
                this.clearAddressBuffer();
                this.clearScroll();
                break;
            case 0x4: //$2004 OAM Data
                returnValue = this.oam[this.oamAddress];
                
                if (!this.vblank) this.oamAddress++;
                break;
            case 0x7: //$2007 Data Register
                var addressBuffer = this.addressBuffer;
                if (addressBuffer>=0x3F00)
                    returnValue = this.readPalette(addressBuffer);
                else
                    returnValue = this.readBuffer;
                
                this.readBuffer = this.readData(addressBuffer);
                this.addressBuffer += this.addressIncrement;
                break;
            }
            return returnValue;
        },
        write: function(address, data) {
            var toggle;
            switch (address&0x7) {
            case 0x0: //$2000 Control Register
                this.baseNametableAddress = 0x2000|(data&0x3)<<10;
                this.addToXScroll = (data&0x1) ? 256 : 0;
                this.addToYScroll = (data&0x2) ? 240 : 0;
                this.addressIncrement = (data&0x04) ? 32 : 1;
                this.spritePatternTableAddress = (data&0x08) ? 0x1000 : 0x0000;
                this.backgroundPatternTableAddress = (data&0x10) ? 0x1000 : 0x0000;
                this.sprite8x16 = data&0x20;
                this.nmiEnabled = data&0x80;
                break;
            case 0x1: //$2001 Mask Register
                this.grayscale = data&0x01;
                this.showLeftMostBackground = data&0x02;
                this.showLeftMostSprites = data&0x04;
                this.showBackground = data&0x08;
                this.showSprites = data&0x10;
                this.emphasisRed = data&(this.ntsc ? 0x20 : 0x40);
                this.emphasisGreen = data&(this.ntsc ? 0x40 : 0x20);
                this.emphasisBlue = data&0x80;
                break;
            case 0x3: //$2003 OAM Address
                this.oamAddress = data;
                break;
            case 0x4: //$2004 OAM Data
                this.oam[this.oamAddress] = data
                this.oamAddress++;
                break;
            case 0x5: //$2005 Scroll Register
                toggle = this.addressToggle;
                if (toggle)
                    this.scrollY = data;
                else
                    this.scrollX = data;
                this.addressToggle = !toggle;
                break;
            case 0x6: //$2006 Address Register
                toggle = this.addressToggle;
                if (toggle)
                    this.addressBuffer += data;
                else
                    this.addressBuffer = data*0x100;
                this.addressToggle = !toggle;
                break;
            case 0x7: //$2007 Data Register
                var addressBuffer = this.addressBuffer;
                if (addressBuffer>=0x3F00)
                    this.writePalette(addressBuffer, data);
                else
                    this.writeData(addressBuffer, data);
                this.addressBuffer += this.addressIncrement;
                break;
            }
        },
        
        readData: function(address) {
            var cartridge = this.bus.cartridge;
            if (cartridge.ciramEnabled(address))
                return this.vram[cartridge.ciramA10(address)?1:0][address&0x3FF];
            else
                return cartridge.ppuRead(address);
        },
        writeData: function(address, data) {
            var cartridge = this.bus.cartridge;
            if (cartridge.ciramEnabled(address))
                this.vram[cartridge.ciramA10(address)?1:0][address&0x3FF] = data;
            else
                cartridge.ppuWrite(address, data);
        },
        
        readPalette: function(address) {
            var colorIndex = address & 0x3;
            var paletteIndex = (address>>2) & 0x3;
            if (!colorIndex)
                return this.backgroundPalette[0][0];
            else
                return (address&0x10 ? this.spritesPalette : 
                                       this.backgroundPalette)[paletteIndex][colorIndex];
        },
        writePalette: function(address, data) {
            var colorIndex = address & 0x3;
            var paletteIndex = (address>>2) & 0x3;
            if (!colorIndex)
                this.backgroundPalette[paletteIndex][0] = data;
            else
                (address&0x10 ? this.spritesPalette : 
                                this.backgroundPalette)[paletteIndex][colorIndex] = data;
        }
    }
    
    Nestled.Ppu = Ppu;
})(window.Nestled = window.Nestled || {});
