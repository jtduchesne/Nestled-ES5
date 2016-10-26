"use strict";

(function(Nestled, undefined) {
    function NoCartridge(opts) {
        this.name = "No Cartridge";
        this.mapperNumber = 0;
    }

    NoCartridge.prototype = Object.create(Nestled.Cartridge.prototype, {
        cpuRead:     {value: function(address) { return 0; }},
        cpuReadWord: {value: function(address) { return 0; }},
        cpuWrite:    {value: function(address, data) { return; }},
        ppuRead:     {value: function(address) { return 0; }},
        ppuWrite:    {value: function(address, data) { return; }}
    });
    NoCartridge.prototype.constructor = NoCartridge;
    
    Nestled.NoCartridge = NoCartridge;
})(window.Nestled = window.Nestled || {});
