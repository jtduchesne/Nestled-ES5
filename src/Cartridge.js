"use strict";

(function(Nestled, undefined) {
    /*
    Cartridge properties:
      PRGRom => Array of Blob (1 blob for each 16kb PRG-ROM pages)
      CHRRom => Array of Blob (1 blob for each 8kb CHR-ROM pages)
      mapperNumber => Number (http://wiki.nesdev.com/w/index.php/Mapper)
      fourscreenMirroring => Boolean
      horizontalMirroring => Boolean
      verticalMirroring   => Boolean
      sramEnabled => Boolean
    */
    function Cartridge(opts) {
        this.PRGRom = (opts && opts['PRGRom']) || [];
        this.CHRRom = (opts && opts['CHRRom']) || [];
        this.highPRGPageIndex = this.PRGRom.length - 1;
        
        this.mapperNumber = (opts && opts['mapperNumber']) || 0;
        
        this.sram = (opts && opts['sram']) || new Array((opts && opts['sramEnabled']) ? 0x2000 : 0);
        
        this.fourscreenMirroring = opts && opts['fourscreenMirroring'];
        this.horizontalMirroring = opts && opts['horizontalMirroring'];
        this.verticalMirroring   = opts && opts['verticalMirroring'];
    }

    Cartridge.prototype = {
        constructor: Cartridge,
        
        //== Memory access ==============================================//
        read: function(address) {
            if (address >= 0xC000) {
                return this.PRGRom[this.highPRGPageIndex][address & 0x3FFF];
            } else if (address >= 0x8000) {
                return this.PRGRom[0][address & 0x3FFF];
            } else {
                return this.sram[address & 0x1FFF];
            }
        },
        readWord: function(address) {
            if (address >= 0xC000) {
                address &= 0x3FFF;
                return this.PRGRom[this.highPRGPageIndex][address] + 
                      (this.PRGRom[this.highPRGPageIndex][address+1] * 0x100);
            } else if (address >= 0x8000) {
                address &= 0x1FFF;
                return this.PRGRom[0][address] + (this.PRGRom[0][address+1] * 0x100);
            } else {
                address &= 0x1FFF;
                return this.sram[address] + (this.sram[address+1] * 0x100);
            }
        },
        write: function(address, data) {
            if (address < 0x8000) {
                this.sram[address & 0x1FFF] = data;
            }
        }
    }
    
    Nestled.Cartridge = Cartridge;
})(window.Nestled = window.Nestled || {});
