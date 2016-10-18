"use strict";

(function(Nestled, undefined) {
    /*
    Nes properties:
      cartridge => Nestled.Cartridge
      joypads   => Array of Nestled.Joypad
      video     => ???
      audio     => ???
    
    Nes events:
      onpower, onreset, oninsertcartridge, onremovecartridge, oninsertjoypad, onremovejoypad
      -> Events occur AFTER the action have been executed
      -> All events function get the Nes object (this) in the argument's 'target' property
         ie: var nes = new Nestled.Nes;
             nes.onpower = function(e) { if (e.target.isPowered) doSomething(); }
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
            
            if (typeof this.onpower === "function")
                setTimeout(this.onpower.bind(null, {target: this}), 1);
            
            return this.isPowered;
        },
        pressReset: function()  {
            this.cpu.doRESET();
            
            if (typeof this.onreset === "function")
                setTimeout(this.onreset.bind(null, {target: this}), 1);
        },
        
        //== Front red LED ===============================//
        // (Yes, it is a fully-fledged part of the NES !)
        
        frontLEDState: function() { return this.isPowered ? 'on' : 'off'; },
    
        //== Cartridge ===================================//
    
        insertCartridge: function(cartridge) {
            this.cartridge = this.cpu.connectCartridge(cartridge);
            
            if (typeof this.oninsertcartridge === "function")
                setTimeout(this.oninsertcartridge.bind(null, {target: this}), 1);
            
            return this.cartridge;
        },
        removeCartridge: function() {
            var cart = this.cartridge;
            this.cartridge = this.cpu.disconnectCartridge();
            
            if (typeof this.onremovecartridge === "function")
                setTimeout(this.onremovecartridge.bind(null, {target: this}), 1);
            
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
            this.joypads[position] = joypad;
            
            if (typeof this.oninsertjoypad === "function")
                setTimeout(this.oninsertjoypad.bind(null, {target: this}), 1);
            
            return this.joypads[position];
        },
        removeJoypad: function(position) {
            position = arguments.length ? position : (this.joypads.length - 1);
            var joypad = this.joypads[position];
            this.joypads[position] = undefined;
            
            if (typeof this.onremovejoypad === "function")
                setTimeout(this.onremovejoypad.bind(null, {target: this}), 1);
            
            return joypad;
        },
        removeAllJoypads: function() {
            this.joypads = [];
            
            if (typeof this.onremovejoypad === "function")
                setTimeout(this.onremovejoypad.bind(null, {target: this}), 1);
        },
        
        //== Video output ================================//
        
        //== Audio output ================================//
    }
    
    Nestled.Nes = Nes;
})(window.Nestled = window.Nestled || {});
