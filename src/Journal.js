"use strict";

(function(Nestled, undefined) {
    /*
    Journal properties:
      resetInterval => Integer
    */
    function Journal(opts) {
        this.data = [];
        this.heat = [];
    }

    Journal.prototype = {
        constructor: Journal,
        
        push: function(pc, opcode, operandWord) {
            var heat = this.heat[pc];
            if (!heat) {
                this.data.push([pc, opcode, operandWord]);
                this.heat[pc] = 1;
            } else {
                if (heat===1) this.data.push([pc, opcode, operandWord, true]);
                this.heat[pc] = heat + 1;
            }
        },
        addBlank: function() {
            var data = this.data;
            if (data[data.length-1]) data.push(0);
        },
        clear: function() {
            this.data.length = 0;
        }
    }

    Nestled.Journal = Journal;
})(window.Nestled = window.Nestled || {});