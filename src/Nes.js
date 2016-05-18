"use strict";

(function(Nestled, undefined) {
    /*
    Nes properties:
      cartridge => Nestled.Cartridge
      joypads   => Array of Nestled.Joypad
      video     => ???
      audio     => ???
    */
    function Nes(opts) {
        //this.cpu = new Nestled.Cpu;
        //this.ppu = new Nestled.Ppu;
        
        this.cartridge = opts && opts[cartridge];
        this.joypads = opts && opts[joypads];
        this.video = opts && opts[video];
        this.audio = opts && opts[audio];
        
        var isPowered = false;
        this.powerOn  = function() { return isPowered = true; };
        this.powerOff = function() { return isPowered = false; };
        this.isPoweredOn  = function() { return isPowered; };
        this.isPoweredOff = function() { return !isPowered; };
    }

    Nes.prototype = {
        constructor: Nes,
    
        //== Buttons =====================================//
    
        pressPower: function() {
            if (this.isPoweredOff()) {
                this.powerOn();// &&
                //... &&
                //this.ppu.powerOn() &&
                //this.cpu.powerOn() &&
                //this.cpu.triggerRESET();
            } else {
                this.powerOff();
            }
            return this.isPoweredOn();
        },
        pressReset: function()  {
            //this.cpu.triggerRESET();
        },
        
        //== Front red LED ===============================//
        // (Yes, it is a fully-fledged part of the NES !)
        
        FrontLEDState: function() { return this.isPoweredOn() ? '1' : '0'; },
    
        //== Cartridge ===================================//
    
        insertCartridge: function(cartridge) {
            return this.cartridge = cartridge;
        },
        removeCartridge: function() {
            var cart = this.cartridge;
            this.cartridge = undefined;
            return cart;
        },
        blowIntoCartridge: function() { //Indeed
            var cart = this.removeCartridge();
            if (cart && (typeof cart.blow == 'function'))
                cart.blow(Math.floor(Math.random() * 3) + 1);
            return this.insertCartridge(cart);
        },
        
        //== Joypads =====================================//
        
        insertJoypad: function(joypad, position) {
            position = position || (this.joypads.length);
            return this.joypads[position] = joypad;
        },
        removeJoypad: function(position) {
            position = arguments.length ? position : (this.joypads.length - 1);
            var joypad = this.joypads[position];
            this.joypads[position] = undefined;
            return joypad;
        },
        removeAllJoypads: function() {
            this.joypads = [];
        }
        
        //== Video output ================================//
        
        //== Audio output ================================//
    }
    
    Nestled.Nes = Nes;
})(window.Nestled = window.Nestled || {});
