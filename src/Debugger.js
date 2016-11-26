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
        //source:   An Array or Array-like object reference
        //target:   Any block element -OR- DOM id of a block element
        //interval: Number of milliseconds between updates (Default: 300ms)
        bindDataOutput: function(name, opts) {
            var scrollElement = opts['target'];
            if (typeof scrollElement === 'string')
                scrollElement = document.getElementById(scrollElement);
            scrollElement.className = "chunker scroll";
            
            var contentElement;
            if (scrollElement.children[0])
                contentElement = scrollElement.children[0];
            else {
                contentElement = document.createElement('ol');
                contentElement.className = "chunker content";
            
                scrollElement.appendChild(contentElement);
            }
            var renderItemFunc = (function(value, index) {
                var elem = document.createElement('li');
                if (value && value[3]) elem.style.backgroundColor = "#FAA";
                elem.appendChild(document.createTextNode(value ? this.getInstructionName(value) : "------"));
                return elem;
            }).bind(this);
            
            var target = new Nestled.Utils.DataChunker({scroll: scrollElement,
                                                        content: contentElement,
                                                        data: opts['source'],
                                                        renderItemFunc: renderItemFunc});
            this.outputs[name] = {type: 'data', target: target,
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
            case 'data':
                var target = output['target'];
                if (output['interval'])
                    output['intervalID'] = setInterval(function() { target.update(); }, output['interval']);
                else
                    target.update();
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
        },
        
        //===============================================================//
        
        //Instruction names with addressing mode lookup table
        instructionNameLookup: [
            "BRK",     "ORA ($h,X)", "KIL",     "NOP ($h,X)", "NOP $h",    "ORA $h",    "ASL $h",    "NOP $h",
            "PHP",     "ORA 0xh",    "ASL",     "NOP 0xh",    "NOP $hh",   "ORA $hh",   "ASL $hh",   "NOP $hh",
            "BPL +d",  "ORA ($h),Y", "KIL",     "NOP ($h),Y", "NOP $h,X",  "ORA $h,X",  "ASL $h,X",  "NOP $h,X",
            "CLC",     "ORA $hh,Y",  "NOP",     "NOP $hh,Y",  "NOP $hh,X", "ORA $hh,X", "ASL $hh,X", "NOP $hh,X",
            "JSR $hh", "AND ($h,X)", "KIL",     "NOP ($h,X)", "BIT $h",    "AND $h",    "ROL $h",    "NOP $h",
            "PLP",     "AND 0xh",    "ROL",     "NOP 0xh",    "BIT $hh",   "AND $hh",   "ROL $hh",   "NOP $hh",
            "BMI +d",  "AND ($h),Y", "KIL",     "NOP ($h),Y", "NOP $h,X",  "AND $h,X",  "ROL $h,X",  "NOP $h,X",
            "SEC",     "AND $hh,Y",  "NOP",     "NOP $hh,Y",  "NOP $hh,X", "AND $hh,X", "ROL $hh,X", "NOP $hh,X",
            "RTI",     "EOR ($h,X)", "KIL",     "NOP ($h,X)", "NOP $h",    "EOR $h",    "LSR $h",    "NOP $h",
            "PHA",     "EOR 0xh",    "LSR",     "NOP 0xh",    "JMP $hh",   "EOR $hh",   "LSR $hh",   "NOP $hh",
            "BVC +d",  "EOR ($h),Y", "KIL",     "NOP ($h),Y", "NOP $h,X",  "EOR $h,X",  "LSR $h,X",  "NOP $h,X",
            "CLI",     "EOR $hh,Y",  "NOP",     "NOP $hh,Y",  "NOP $hh,X", "EOR $hh,X", "LSR $hh,X", "NOP $hh,X",
            "RTS",     "ADC ($h,X)", "KIL",     "NOP ($h,X)", "NOP $h",    "ADC $h",    "ROR $h",    "NOP $h",
            "PLA",     "ADC 0xh",    "ROR",     "NOP 0xh",    "JMP ($hh)", "ADC $hh",   "ROR $hh",   "NOP $hh",
            "BVS +d",  "ADC ($h),Y", "KIL",     "NOP ($h),Y", "NOP $h,X",  "ADC $h,X",  "ROR $h,X",  "NOP $h,X",
            "SEI",     "ADC $hh,Y",  "NOP",     "NOP $hh,Y",  "NOP $hh,X", "ADC $hh,X", "ROR $hh,X", "NOP $hh,X",
            "NOP 0xh", "STA ($h,X)", "NOP 0xh", "NOP ($h,X)", "STY $h",    "STA $h",    "STX $h",    "NOP $h",
            "DEY",     "NOP 0xh",    "TXA",     "NOP 0xh",    "STY $hh",   "STA $hh",   "STX $hh",   "NOP $hh",
            "BCC +d",  "STA ($h),Y", "KIL",     "NOP ($h),Y", "STY $h,X",  "STA $h,X",  "STX $h,Y",  "NOP $h,Y",
            "TYA",     "STA $hh,Y",  "TXS",     "NOP $hh,Y",  "SHY $hh,X", "STA $hh,X", "SHX $hh,Y", "NOP $hh,Y",
            "LDY 0xh", "LDA ($h,X)", "LDX 0xh", "NOP ($h,X)", "LDY $h",    "LDA $h",    "LDX $h",    "NOP $h",
            "TAY",     "LDA 0xh",    "TAX",     "NOP 0xh",    "LDY $hh",   "LDA $hh",   "LDX $hh",   "NOP $hh",
            "BCS +d",  "LDA ($h),Y", "KIL",     "NOP ($h),Y", "LDY $h,X",  "LDA $h,X",  "LDX $h,Y",  "NOP $h,Y",
            "CLV",     "LDA $hh,Y",  "TSX",     "NOP $hh,Y",  "LDY $hh,X", "LDA $hh,X", "LDX $hh,Y", "NOP $hh,Y",
            "CPY 0xh", "CMP ($h,X)", "NOP 0xh", "NOP ($h,X)", "CPY $h",    "CMP $h",    "DEC $h",    "NOP $h",
            "INY",     "CMP 0xh",    "DEX",     "NOP 0xh",    "CPY $hh",   "CMP $hh",   "DEC $hh",   "NOP $hh",
            "BNE +d",  "CMP ($h),Y", "KIL",     "NOP ($h),Y", "NOP $h,X",  "CMP $h,X",  "DEC $h,X",  "NOP $h,X",
            "CLD",     "CMP $hh,Y",  "NOP",     "NOP $hh,Y",  "NOP $hh,X", "CMP $hh,X", "DEC $hh,X", "NOP $hh,X",
            "CPX 0xh", "SBC ($h,X)", "NOP 0xh", "NOP ($h,X)", "CPX $h",    "SBC $h",    "INC $h",    "NOP $h",
            "INX",     "SBC 0xh",    "NOP",     "NOP 0xh",    "CPX $hh",   "SBC $hh",   "INC $hh",   "NOP $hh",
            "BEQ +d",  "SBC ($h),Y", "KIL",     "NOP ($h),Y", "NOP $h,X",  "SBC $h,X",  "INC $h,X",  "NOP $h,X",
            "SED",     "SBC $hh,Y",  "NOP",     "NOP $hh,Y",  "NOP $hh,X", "SBC $hh,X", "INC $hh,X", "NOP $hh,X"
        ],
        zeroFill: function(number, length) {
            number = number.toString();
            return Math.pow(10, length-number.length).toString().substr(1)+number;
        },
        getInstructionName: function(args) {
            var pc = args[0];
            var opcode = args[1];
            var operand = args[2];
            var zeroFill = this.zeroFill;
            function formatInstructionName(match) {
                switch (match) {
                case 'd':  return operand;
                case '+d':
                    operand %= 256;
                    operand = operand>0x7F ? operand-0x100 : operand;
                    return (operand>0) ? "+"+operand : operand;
                case 'h':  return zeroFill((operand%256).toString(16), 2);
                case 'hh': return zeroFill(operand.toString(16), 4);
                }
            }
            return "0x"+zeroFill(pc.toString(16), 4)+"  "+
                   this.instructionNameLookup[opcode].replace(/\+?d|h{1,2}/g, formatInstructionName);
        }
    }

    Nestled.Debugger = Debugger;
})(window.Nestled = window.Nestled || {});