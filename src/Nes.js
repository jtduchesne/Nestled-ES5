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
        this.isPowered = false;
        
        this.cartridge = opts && opts['cartridge'];
        this.joypads = opts && opts['joypads'];
        this.video = opts && opts['video'];
        this.audio = opts && opts['audio'];
        
        this.cpu = new Nestled.Cpu(this.cartridge);
        //this.ppu = new Nestled.Ppu(this.cartridge);
        
        var currentLoop;
        var currentNes = this;
        this.powerOn  = function() {
            currentNes.cpu.powerOn();
            (function mainLoop() {
                currentLoop = window.requestAnimationFrame(mainLoop);
                currentNes.cpu.doFrame();
            })();
            return currentNes.isPowered = true;
        };
        this.powerOff = function() {
            currentNes.cpu.powerOff();
            window.cancelAnimationFrame(currentLoop);
            return currentNes.isPowered = false;
        };
    }

    Nes.prototype = {
        constructor: Nes,
    
        //== Buttons =====================================//
    
        pressPower: function() {
            if (!this.isPowered) {
                this.powerOn();
            } else {
                this.powerOff();
            }
            return this.isPowered;
        },
        pressReset: function()  {
            this.cpu.doRESET();
        },
        
        //== Front red LED ===============================//
        // (Yes, it is a fully-fledged part of the NES !)
        
        FrontLEDState: function() { return this.isPowered ? '1' : '0'; },
    
        //== Cartridge ===================================//
    
        insertCartridge: function(cartridge) {
            return this.cartridge = this.cpu.connectCartridge(cartridge);
        },
        removeCartridge: function() {
            var cart = this.cartridge;
            this.cartridge = this.cpu.disconnectCartridge();
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
