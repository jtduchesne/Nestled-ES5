"use strict";

(function(Nestled, undefined) {
    function NoCartridge(opts) {
        this.name = "No Cartridge";
        this.mapperNumber = 0;
    }

    NoCartridge.prototype = Object.create(Nestled.Cartridge.prototype, {
        read:     {value: function(address) { return 0; }},
        readWord: {value: function(address) { return 0; }},
        write:    {value: function(address, data) { return; }}
    });
    NoCartridge.prototype.constructor = NoCartridge;
    
    Nestled.NoCartridge = NoCartridge;
})(window.Nestled = window.Nestled || {});
