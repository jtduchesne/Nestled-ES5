"use strict";

(function(Nestled, undefined) {
    function Debugger(opts) {
        this.outputs = {};
    }

    Debugger.prototype = {
        constructor: Debugger,
        
        //source: An object that responds to #attachOutput(output)
        //target: Canvas object -OR- DOM id of Canvas element
        bindImageOutput: function(name, opts) {
            var target = opts['target'];
            if (typeof target === 'string')
                target = document.getElementById(target);
            this.outputs[name] = {type: 'image', source: opts['source'], target: target};
        },
        //source:   An Object (the name of the property to watch will then be the value of 'name')
        //          -OR- An Array containing: [Object, 'property to watch']
        //          -OR- A function returning a string
        //target:   Any element -OR- DOM id of an element with an .innerText property
        //modifier: The name of a preset modifier [Binary, Hex, Round, StatusFlags] (Default: none)
        //interval: Number of milliseconds between updates (Default: 300ms)
        bindTextOutput: function(name, opts) {
            var type;
            var source = opts['source'];
            if (typeof source === 'function')
                type = 'func';
            else {
                type = 'prop';
                if (!Array.isArray(source)) source = [source];
                if (!source[1]) source[1] = name;
            }
            var target = opts['target'];
            if (typeof target === 'string')
                target = document.getElementById(target);
            this.outputs[name] = {type: type, source: source, target: target,
                                              modifier: opts['modifier'],
                                              interval: opts['interval'] || 300};
        },
        
        //===============================================================//
        
        enable: function(name) {
            var output = this.outputs[name];
            switch(output['type']) {
            case 'image':
                output['source'].attachOutput(output['target']);
                break;
            case 'prop':
                var zeroFill = this.zeroFill;
                output['intervalID'] = (function() {
                    var srcObject = output['source'][0];
                    var srcProperty = output['source'][1];
                    var target = output['target'];
                    var func;
                    switch (output['modifier'].toLowerCase()) {
                    case "binary":
                        func = function() { target.innerText = srcObject[srcProperty].toString(2); };
                        break;
                    case "hex":
                        func = function() {
                            target.innerText = srcObject[srcProperty].toString(16).toUpperCase(); };
                        break;
                    case "byte":
                        func = function() {
                            target.innerText = zeroFill(srcObject[srcProperty].toString(16).toUpperCase(), 2); };
                        break;
                    case "word":
                        func = function() {
                            target.innerText = zeroFill(srcObject[srcProperty].toString(16).toUpperCase(), 4); };
                        break;
                    case "round":
                        func = function() { target.innerText = Math.round(srcObject[srcProperty]); };
                        break;
                    case "statusflags":
                        func = function() {
                            var p = srcObject[srcProperty];
                            target.innerText = ""+p+" ["+(p&0x80?"N":"-")+(p&0x40?"V":"-")+"--"+
                                               (p&0x8?"D":"-")+(p&0x4?"I":"-")+(p&0x2?"Z":"-")+(p&0x1?"C":"-")+"]"; };
                        break;
                    default:
                        func = function() { target.innerText = srcObject[srcProperty]; };
                        break;
                    }
                    return setInterval(func, output['interval']);
                })();
                break;
            case 'func':
                output['intervalID'] = (function() {
                    var srcFunc = output['source'];
                    var target = output['target'];
                    return setInterval(function() {
                        target.innerText = srcFunc();
                    }, output['interval']);
                })();
                break;
            }
        },
        enableAll: function(names) {
            if (typeof names === 'undefined') names = Object.keys(this.outputs);
            if (!Array.isArray(names)) names = [names];
            for (var i=0; i<names.length; i++)
                this.enable(names[i]);
        },
        disable: function(name) {
            var output = this.outputs[name];
            switch(output['type']) {
            case 'image':
                output['source'].detachOutput();
                break;
            default:
                if (output['intervalID']) clearInterval(output['intervalID']);
                break;
            }
        },
        disableAll: function(names) {
            if (typeof names === 'undefined') names = Object.keys(this.outputs);
            if (!Array.isArray(names)) names = [names];
            for (var i=0; i<names.length; i++)
                this.disable(names[i]);
        }
    }

    Nestled.Debugger = Debugger;
})(window.Nestled = window.Nestled || {});