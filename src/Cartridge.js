"use strict";

(function(Nestled, undefined) {
    /*
    Cartridge properties:
      file   => File object (Can only be passed as argument to constructor,
                             all the properties from the file will be overriden by
                             those set manually)
      name => String
      PRGRom => Array of Uint8Array (1 for each 16kb PRG-ROM pages)
      CHRRom => Array of Uint8Array (1 for each 8kb CHR-ROM pages)
      sram => Uint8Array
      mapperNumber => Number (http://wiki.nesdev.com/w/index.php/Mapper)
      fourscreenMirroring => Boolean
      horizontalMirroring => Boolean
      verticalMirroring   => Boolean
      sramEnabled => Boolean
    */
    function Cartridge(opts) {
        if (opts && opts['file'])
            this.createFromFile(file);
        
        this.name = opts && opts['name'];
        this.clearPRGData();
        this.clearCHRData();
        var pageIndex;
        if (opts && opts['PRGRom']) {
            for (pageIndex = 0; pageIndex < opts['PRGRom'].length; pageIndex++)
                this.addPRGData(opts['PRGRom'][pageIndex]);
        }
        if (opts && opts['CHRRom']) {
            for (pageIndex = 0; pageIndex < opts['CHRRom'].length; pageIndex++)
                this.addCHRData(opts['CHRRom'][pageIndex]);
        }
        
        this.mapperNumber = (opts && opts['mapperNumber']) || 0;
        
        this.sram = (opts && opts['sram']) ||
                    this.normalizeData(new Array((opts && opts['sramEnabled']) ? 0x2000 : 0));
        
        this.fourscreenMirroring = opts && opts['fourscreenMirroring'];
        this.horizontalMirroring = opts && opts['horizontalMirroring'];
        this.verticalMirroring   = opts && opts['verticalMirroring'];
    }

    Cartridge.prototype = {
        constructor: Cartridge,
        
        addPRGData: function(data) {
            this.PRGRom.push(this.normalizeData(data));
            this.highPRGPageIndex = this.PRGRom.length - 1;
        },
        clearPRGData: function() {
            this.PRGRom = [];
            this.highPRGPageIndex = null;
        },
        addCHRData: function(data) {
            this.CHRRom.push(this.normalizeData(data)); },
        clearCHRData: function() {
            this.CHRRom = []; },
        
        normalizeData: function(data) {
            if (ArrayBuffer.isView(data)) return data;
            else return (new Uint8Array(data));
        },
        
        createFromFile: function(file) {
            if (file.isValid) {
                var header = new Uint8Array(file.data.slice(0, 16));
                
                file.updateStatus("Verifying " + file.name + "...");
                var signature = new Uint32Array(header.buffer)[0];
                if (signature != 0x1A53454E) { //"NES" followed by MS-DOS end-of-file
                    file.updateStatus("Invalid format", true);
                    return false;
                } else
                    file.updateStatus("iNES format", true);
                
                file.updateStatus("Reading header...");
                this.horizontalMirroring = !!(header[6]&0x1);
                this.verticalMirroring   =  !(header[6]&0x1);
                this.sramEnabled         = !!(header[6]&0x2);
                this.fourscreenMirroring = !!(header[6]&0x8);
            
                this.mapperNumber = (header[6]>>4) + (header[7]&0xF0);
                file.updateStatus((new Nestled.Mapper).getFormattedName(this.mapperNumber), true)
            
                var curPos = 0x10;
                if (header[6]&0x4) curPos += 0x200;
                
                file.updateStatus("Reading data...");
                
                this.clearPRGData();
                for (var prgromPage = 0; prgromPage < header[4]; prgromPage++) {
                    this.addPRGData(file.data.slice(curPos, curPos+0x8000));
                    curPos += 0x8000; }
                file.updateStatus(prgromPage*16 + "kb of PRG-Rom", true)
                
                this.clearCHRData();
                for (var chrromPage = 0; chrromPage < header[5]; chrromPage++) {
                    this.addCHRData(file.data.slice(curPos, curPos+0x4000));
                    curPos += 0x4000; }
                file.updateStatus(chrromPage*8 + "kb of CHR-Rom", true)
            
                if (curPos < file.data.byteLength)
                    this.name = String.fromCharCode.apply(null, new Uint8Array(file.data.slice(curPos))).replace(/\0/g, '');
                else
                    this.name = file.name;
            
                file.updateStatus("Successfully loaded " + this.name)
                return true;
            } else {
                file.updateStatus(file.name + " is invalid");
                return false;
            }
        },
        
        //== Memory access from CPU =====================================//
        cpuRead: function(address) {
            if (address >= 0xC000) {
                return this.PRGRom[this.highPRGPageIndex][address & 0x3FFF];
            } else if (address >= 0x8000) {
                return this.PRGRom[0][address & 0x3FFF];
            } else {
                return this.sram[address & 0x1FFF];
            }
        },
        cpuReadWord: function(address) {
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
        cpuWrite: function(address, data) {
            if (address < 0x8000) {
                this.sram[address & 0x1FFF] = (data & 0xFF);
            }
        },
        
        //== Memory access from PPU =====================================//
        ppuRead: function(address) {
            return this.CHRRom[0][address & 0x1FFF];
        },
        ppuWrite: function(address, data) {
            return;
        },
        
        //== CIRAM /CE (Pin22) and CIRAM A10 (Pin57) ====================//
        ciramEnabled: function(address) {
            return address & 0x2000; //Connected to PPU /A13 by default
        },
        ciramA10: function(address) {
            if (this.horizontalMirroring)
                return address & 0x800; //Connected to PPU A11
            else if (this.verticalMirroring)
                return address & 0x400; //Connected to PPU A10
            else
                return 0;
        }
    }
    
    Nestled.Cartridge = Cartridge;
})(window.Nestled = window.Nestled || {});
