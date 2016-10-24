"use strict";

(function(Nestled, undefined) {
    /*
    Nes properties:
      cartridge => Nestled.Cartridge
      joypads   => Array of Nestled.Joypad
      video     => ???
      audio     => ???
    
    Nes events:
      onpower, onreset, onpauseemu, onresumeemu,
      oninsertcartridge, onremovecartridge, oninsertjoypad, onremovejoypad
      -> Events occur AFTER the action have been executed
      -> All events function get the Nes object (this) in the argument's 'target' property
         ie: var nes = new Nestled.Nes;
             nes.onpower = function(e) { if (e.target.isPowered) doSomething(); }
    */
    function Nes(opts) {
        this.isPowered = false;
        
        if (opts && opts['cartridge'])
            this.insertCartridge(opts['cartridge']);
        else
            this.removeCartridge();
        this.joypads = opts && opts['joypads'];
        this.video = opts && opts['video'];
        this.audio = opts && opts['audio'];
        
        //this.ppu = new Nestled.Ppu(this.cartridge);
        this.cpu = new Nestled.Cpu(this);
        
        var maxFPS = 60;
        var maxFrameTime = 1000.0/maxFPS;
        this.fps = maxFPS;
        this.emulationSpeed = 0.0;
        
        var deltaTime = 0.0;
        var lastLoopTime = 0.0;
        var lastRenderTime = 0.0;
        var averageDuration = 0.0;
        
        var currentLoop;
        var currentNes = this;
        var mainLoop = function(startTime) {
            deltaTime += Math.min(1000, startTime - (lastLoopTime || startTime));
            
            if (deltaTime > maxFrameTime) {
                while(deltaTime > maxFrameTime) {
                    currentNes.cpu.doFrame();
                    deltaTime -= maxFrameTime;
                }
                //currentNes.ppu.renderFrame();
                
                averageDuration += (startTime-(lastRenderTime||lastLoopTime)-averageDuration)/10;
                
                currentNes.fps = Math.round(1000/averageDuration);
                currentNes.emulationSpeed = (maxFrameTime/(window.performance.now() - startTime))*100;
                
                lastRenderTime = startTime;
            }
            lastLoopTime = startTime;
            
            currentLoop = window.requestAnimationFrame(mainLoop);
        };
        
        this.powerOn  = function() {
            deltaTime = 0.0;
            lastLoopTime = 0.0;
            lastRenderTime = 0.0;
            averageDuration = 0.0;
            currentNes.fps = maxFPS;
            currentNes.emulationSpeed = 0.0;
            
            currentNes.cpu.powerOn();
            currentLoop = window.requestAnimationFrame(mainLoop);
            return currentNes.isPowered = true;
        };
        this.powerOff = function() {
            currentNes.cpu.powerOff();
            window.cancelAnimationFrame(currentLoop);
            return currentNes.isPowered = false;
        };
        
        this.paused = false;
        
        this.pauseEmulation  = function() {
            if (currentNes.isPowered) window.cancelAnimationFrame(currentLoop);
            currentNes.paused = true;
            
            if (typeof currentNes.onpauseemu === "function")
                setTimeout(currentNes.onpauseemu.bind(null, {target: currentNes}), 1);
        };
        this.resumeEmulation = function() {
            if (currentNes.isPowered) window.requestAnimationFrame(mainLoop);
            currentNes.paused = false;
            
            if (typeof currentNes.onresumeemu === "function")
                setTimeout(currentNes.onresumeemu.bind(null, {target: currentNes}), 1);
        }
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
            this.cartridge = cartridge;
            
            if (typeof this.oninsertcartridge === "function")
                setTimeout(this.oninsertcartridge.bind(null, {target: this}), 1);
            
            return this.cartridge;
        },
        removeCartridge: function() {
            var removedCart = this.cartridge;
            this.cartridge = new Nestled.NoCartridge;
            
            if (typeof this.onremovecartridge === "function")
                setTimeout(this.onremovecartridge.bind(null, {target: this}), 1);
            
            return removedCart;
        },
        blowIntoCartridge: function() { //Indeed
            var cart = this.removeCartridge();
            if (cart && (typeof cart.blow === 'function'))
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
