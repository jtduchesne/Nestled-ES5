"use strict";

(function(Nestled, undefined) {
    /*
    Cpu properties:
      nes => Nestled.Nes
    */
    function Cpu(nes) {
        this.bus = nes;
        
        //RAM
        this.ram = new Array(0x800);
        
        //Addressing modes lookup table
        this.addressLookup = [
            this.imp, this.indX, this.imp, this.indX, this.zero,  this.zero,  this.zero,  this.zero,  this.imp, this.imm,  this.imp, this.imm,  this.abs,  this.abs,  this.abs,  this.abs,
            this.rel, this.indY, this.imp, this.indY, this.zeroX, this.zeroX, this.zeroX, this.zeroX, this.imp, this.absY, this.imp, this.absY, this.absX, this.absX, this.absX, this.absX,
            this.abs, this.indX, this.imp, this.indX, this.zero,  this.zero,  this.zero,  this.zero,  this.imp, this.imm,  this.imp, this.imm,  this.abs,  this.abs,  this.abs,  this.abs,
            this.rel, this.indY, this.imp, this.indY, this.zeroX, this.zeroX, this.zeroX, this.zeroX, this.imp, this.absY, this.imp, this.absY, this.absX, this.absX, this.absX, this.absX,
            this.imp, this.indX, this.imp, this.indX, this.zero,  this.zero,  this.zero,  this.zero,  this.imp, this.imm,  this.imp, this.imm,  this.abs,  this.abs,  this.abs,  this.abs,
            this.rel, this.indY, this.imp, this.indY, this.zeroX, this.zeroX, this.zeroX, this.zeroX, this.imp, this.absY, this.imp, this.absY, this.absX, this.absX, this.absX, this.absX,
            this.imp, this.indX, this.imp, this.indX, this.zero,  this.zero,  this.zero,  this.zero,  this.imp, this.imm,  this.imp, this.imm,  this.ind,  this.abs,  this.abs,  this.abs,
            this.rel, this.indY, this.imp, this.indY, this.zeroX, this.zeroX, this.zeroX, this.zeroX, this.imp, this.absY, this.imp, this.absY, this.absX, this.absX, this.absX, this.absX,
            this.imm, this.indX, this.imm, this.indX, this.zero,  this.zero,  this.zero,  this.zero,  this.imp, this.imm,  this.imp, this.imm,  this.abs,  this.abs,  this.abs,  this.abs,
            this.rel, this.indY, this.imp, this.indY, this.zeroX, this.zeroX, this.zeroY, this.zeroY, this.imp, this.absY, this.imp, this.absY, this.absX, this.absX, this.absY, this.absY,
            this.imm, this.indX, this.imm, this.indX, this.zero,  this.zero,  this.zero,  this.zero,  this.imp, this.imm,  this.imp, this.imm,  this.abs,  this.abs,  this.abs,  this.abs,
            this.rel, this.indY, this.imp, this.indY, this.zeroX, this.zeroX, this.zeroY, this.zeroY, this.imp, this.absY, this.imp, this.absY, this.absX, this.absX, this.absY, this.absY,
            this.imm, this.indX, this.imm, this.indX, this.zero,  this.zero,  this.zero,  this.zero,  this.imp, this.imm,  this.imp, this.imm,  this.abs,  this.abs,  this.abs,  this.abs,
            this.rel, this.indY, this.imp, this.indY, this.zeroX, this.zeroX, this.zeroX, this.zeroX, this.imp, this.absY, this.imp, this.absY, this.absX, this.absX, this.absX, this.absX,
            this.imm, this.indX, this.imm, this.indX, this.zero,  this.zero,  this.zero,  this.zero,  this.imp, this.imm,  this.imp, this.imm,  this.abs,  this.abs,  this.abs,  this.abs,
            this.rel, this.indY, this.imp, this.indY, this.zeroX, this.zeroX, this.zeroX, this.zeroX, this.imp, this.absY, this.imp, this.absY, this.absX, this.absX, this.absX, this.absX
        ];
        
        //Instructions lookup table
        this.instructionLookup = [
            this.BRK, this.ORA, this.KIL, this.NOP, this.NOP, this.ORA, this.ASL, this.NOP, this.PHP, this.ORA, this.ASL, this.NOP, this.NOP, this.ORA, this.ASL, this.NOP,
            this.BPL, this.ORA, this.KIL, this.NOP, this.NOP, this.ORA, this.ASL, this.NOP, this.CLC, this.ORA, this.NOP, this.NOP, this.NOP, this.ORA, this.ASL, this.NOP,
            this.JSR, this.AND, this.KIL, this.NOP, this.BIT, this.AND, this.ROL, this.NOP, this.PLP, this.AND, this.ROL, this.NOP, this.BIT, this.AND, this.ROL, this.NOP,
            this.BMI, this.AND, this.KIL, this.NOP, this.NOP, this.AND, this.ROL, this.NOP, this.SEC, this.AND, this.NOP, this.NOP, this.NOP, this.AND, this.ROL, this.NOP,
            this.RTI, this.EOR, this.KIL, this.NOP, this.NOP, this.EOR, this.LSR, this.NOP, this.PHA, this.EOR, this.LSR, this.NOP, this.JMP, this.EOR, this.LSR, this.NOP,
            this.BVC, this.EOR, this.KIL, this.NOP, this.NOP, this.EOR, this.LSR, this.NOP, this.CLI, this.EOR, this.NOP, this.NOP, this.NOP, this.EOR, this.LSR, this.NOP,
            this.RTS, this.ADC, this.KIL, this.NOP, this.NOP, this.ADC, this.ROR, this.NOP, this.PLA, this.ADC, this.ROR, this.NOP, this.JMP, this.ADC, this.ROR, this.NOP,
            this.BVS, this.ADC, this.KIL, this.NOP, this.NOP, this.ADC, this.ROR, this.NOP, this.SEI, this.ADC, this.NOP, this.NOP, this.NOP, this.ADC, this.ROR, this.NOP,
            this.NOP, this.STA, this.NOP, this.NOP, this.STY, this.STA, this.STX, this.NOP, this.DEY, this.NOP, this.TXA, this.NOP, this.STY, this.STA, this.STX, this.NOP,
            this.BCC, this.STA, this.KIL, this.NOP, this.STY, this.STA, this.STX, this.NOP, this.TYA, this.STA, this.TXS, this.NOP, this.SHY, this.STA, this.SHX, this.NOP,
            this.LDY, this.LDA, this.LDX, this.NOP, this.LDY, this.LDA, this.LDX, this.NOP, this.TAY, this.LDA, this.TAX, this.NOP, this.LDY, this.LDA, this.LDX, this.NOP,
            this.BCS, this.LDA, this.KIL, this.NOP, this.LDY, this.LDA, this.LDX, this.NOP, this.CLV, this.LDA, this.TSX, this.NOP, this.LDY, this.LDA, this.LDX, this.NOP,
            this.CPY, this.CMP, this.NOP, this.NOP, this.CPY, this.CMP, this.DEC, this.NOP, this.INY, this.CMP, this.DEX, this.NOP, this.CPY, this.CMP, this.DEC, this.NOP,
            this.BNE, this.CMP, this.KIL, this.NOP, this.NOP, this.CMP, this.DEC, this.NOP, this.CLD, this.CMP, this.NOP, this.NOP, this.NOP, this.CMP, this.DEC, this.NOP,
            this.CPX, this.SBC, this.NOP, this.NOP, this.CPX, this.SBC, this.INC, this.NOP, this.INX, this.SBC, this.NOP, this.NOP, this.CPX, this.SBC, this.INC, this.NOP,
            this.BEQ, this.SBC, this.KIL, this.NOP, this.NOP, this.SBC, this.INC, this.NOP, this.SED, this.SBC, this.NOP, this.NOP, this.NOP, this.SBC, this.INC, this.NOP
        ];
        
        this.journal = [];
        this.journalHeat = [];
        
        this.powerOff();
    }

    Cpu.prototype = {
        constructor: Cpu,
        
        ticksPerFrame: 21477272/12/60, //Hardcoded to NTSC for now...
        cyclesLookup: [7,6,2,8,3,3,5,5,3,2,2,2,4,4,6,6, 2,5,2,8,4,4,6,6,2,4,2,7,4,4,7,7,
                       6,6,2,8,3,3,5,5,4,2,2,2,4,4,6,6, 2,5,2,8,4,4,6,6,2,4,2,7,4,4,7,7,
                       6,6,2,8,3,3,5,5,3,2,2,2,3,4,6,6, 2,5,2,8,4,4,6,6,2,4,2,7,4,4,7,7,
                       6,6,2,8,3,3,5,5,4,2,2,2,5,4,6,6, 2,5,2,8,4,4,6,6,2,4,2,7,4,4,7,7,
                       2,6,2,6,3,3,3,3,2,2,2,2,4,4,4,4, 2,6,2,6,4,4,4,4,2,5,2,5,5,5,5,5,
                       2,6,2,6,3,3,3,3,2,2,2,2,4,4,4,4, 2,5,2,5,4,4,4,4,2,4,2,4,4,4,4,4,
                       2,6,2,8,3,3,5,5,2,2,2,2,4,4,6,6, 2,5,2,8,4,4,6,6,2,4,2,7,4,4,7,7,
                       2,6,3,8,3,3,5,5,2,2,2,2,4,4,6,6, 2,5,2,8,4,4,6,6,2,4,2,7,4,4,7,7],
        
        powerOn:  function() {
            this.isPowered = true;
            this.doRESET();
            this.journal.length = 0;
        },
        powerOff: function() {
            this.tick = 0;
            this.frame = 0;
            
            //Program counter
            this.PC = 0;
            //Accumulator
            this.A = 0;
            //Indexes
            this.X = 0;
            this.Y = 0;
            //Status register: Negative|oVerflow|---|*BRK*|Decimal|Interrupt|Zero|Carry
            //                 [MSB] <-----<-----<-----<-----<-----<-----<-----<- [LSB]
            this.P = 0x34; //b00110100
            //Stack pointer
            this.SP = 0xFD;
            
            this.isPowered = false;
        },
                
        //== Main loop ==================================================//
        doFrame: function() {
            var maxTicks = this.ticksPerFrame;
            while(this.tick < maxTicks)
                this.doInstruction();
            this.tick -= maxTicks;
            this.frame++;
            if (this.frame&64)
                this.journalHeat = [];
        },
        doInstruction: function() {
            var pc = this.PC++;
            var opcode  = this.read(pc);
            var operand = this.read(pc+1);
            var operandWord = operand + this.read(pc+2)*256;
            
            var heat = this.journalHeat[pc];
            if (!heat) this.journal.push([pc, opcode, operandWord]);
            else if (heat===1) this.journal.push([pc, opcode, operandWord, true]);
            this.journalHeat[pc] = (heat || 0) + 1;
            
            this.instructionLookup[opcode].call(this, function() {
                return this.addressLookup[opcode].call(this, operand);
            });
            this.tick += this.cyclesLookup[opcode];
        },
        
        //== Interrupts =================================================//
        doNMI: function() {
            this.pushWord(this.PC);
            this.pushByte(this.P & ~0x10);
            this.PC = this.readWord(0xFFFA);
        },
        doRESET: function() {
            this.SP = (this.SP+3) & 0xFF;
            this.setInterrupt();
            this.PC = this.readWord(0xFFFC);
        },
        doIRQ: function() {
            this.pushWord(this.PC);
            this.pushByte(this.P & ~0x10);
            this.PC = this.readWord(0xFFFE);
        },
        
        //== Memory access ==============================================//
        read: function(address) {
            var data;
            if (address < 0x2000) {
                data = this.ram[address & 0x7FF];
            } else if (address < 0x4018) {
                if (address < 0x4000) {
                    data = this.bus.ppu.read(address);
                }
                else if (address == 0x4016) { /* return this.joypad[0].read(); */ }
                else if (address == 0x4017) { /* return this.joypad[1].read(); */ }
                else                        { /* return this.apu.read(); */ }
            } else {
                data = this.bus.cartridge.cpuRead(address);
            }
            return data || 0;
        },
        readWord: function(address) {
            var data;
            if (address < 0x2000) {
                address &= 0x7FF;
                data = this.ram[address] + (this.ram[address+1] * 0x100);
            } else {
                data = this.bus.cartridge.cpuReadWord(address);
            }
            return data || 0;
        },
        write: function(address, data) {
            if (address < 0x2000) {
                this.ram[address & 0x7FF] = (data & 0xFF);
            } else if (address < 0x4018) {
                if (address < 0x4000) {
                    this.bus.ppu.write(address, data);
                } else if (address == 0x4014) { //PPU DMA Access
                    address = data<<16;
                    var dmaIn = this.read.bind(this);
                    var dmaOut = this.bus.ppu.write.bind(this.bus.ppu);
                    for(var stopAddress = address+0x100; address<stopAddress; address++)
                        dmaOut(0x2004, dmaIn(address));
                    this.tick += 513+(this.tick&1);
                }
                else if (address == 0x4016) { /* (Joypads strobe); */ }
                else                        { /* this.apu.write(address,data); */ }
            } else {
                this.bus.cartridge.cpuWrite(address, data);
            }
        },
        
        //== Stack ======================================================//
        pushByte: function(value) {
            this.ram[0x100 + (this.SP = this.SP-1 & 0xFF)] = value;
        },
        pushWord: function(value) {
            this.pushByte(value >> 8);
            this.pushByte(value & 0xFF);
        },
        
        pullByte: function() {
            var alu = this.ram[0x100 + this.SP] || 0;
            this.SP = this.SP+1 & 0xFF;
            return alu;
        },
        pullWord: function() {
            return this.pullByte() + (this.pullByte() * 0x100);
        },
        
        //== Registers ==================================================//
        
        setA:   function(value) { return this.setZNFlags(this.A = value); },
        setX:   function(value) { return this.setZNFlags(this.X = value); },
        setY:   function(value) { return this.setZNFlags(this.Y = value); },
        
        setZNFlags: function(value) {
            this.setZero(!(value&0xFF));
            this.setNegative(this.cSignedByte(value)<0);
            return value;
        },
        
        //== Status =====================================================//
        getCarry:     function() { return this.P & 0x01; },
        getZero:      function() { return this.P & 0x02; },
        getInterrupt: function() { return this.P & 0x04; },
        getDecimal:   function() { return this.P & 0x08; },
        getOverflow:  function() { return this.P & 0x40; },
        getNegative:  function() { return this.P & 0x80; },
        
        setCarry:     function(value) { (value ? (this.P |= 0x01) : this.clrCarry()); return value; },
        setZero:      function(value) { (value ? (this.P |= 0x02) : this.clrZero()); return value; },
        setInterrupt: function() { this.P |= 0x04; return true; },
        setDecimal:   function() { this.P |= 0x08; return true; },
        setOverflow:  function(value) { (value ? (this.P |= 0x40) : this.clrOverflow()); return value; },
        setNegative:  function(value) { (value ? (this.P |= 0x80) : this.clrNegative()); return value; },
        
        clrCarry:     function() { this.P &= ~0x01; return false; },
        clrZero:      function() { this.P &= ~0x02; return false; },
        clrInterrupt: function() { this.P &= ~0x04; return false; },
        clrDecimal:   function() { this.P &= ~0x08; return false; },
        clrOverflow:  function() { this.P &= ~0x40; return false; },
        clrNegative:  function() { this.P &= ~0x80; return false; },
        
        //== Addressing Modes ===========================================//
        
        imp:   function(operand) { return null; },    //Implied
        imm:   function(operand) { return this.PC; }, //Immediate - #00
        
        rel:   function(operand) { return ++this.PC + this.cSignedByte(operand); }, //Relative - ±#00
        
        zero:  function(operand) { return operand & 0xFF; },              //Zero Page - $00
        zeroX: function(operand) { return this.zero(operand + this.X); }, //Zero Page indexed X - $00+X
        zeroY: function(operand) { return this.zero(operand + this.Y); }, //Zero Page indexed Y - $00+Y
        
        abs:   function(operand) { //Absolute - $0000
            return operand + (this.read(++this.PC) * 256); },
        absX:  function(operand) { //Absolute indexed X - $0000+X
            if (operand + this.X > 0xFF) this.tick++;
            return this.abs(operand) + this.X; },
        absY:  function(operand) { //Absolute indexed Y - $0000+Y
            if (operand + this.Y > 0xFF) this.tick++;
            return this.abs(operand) + this.Y; },
        
        ind:   function(operand) { //Indirect - ($0000)
            return this.readWord(this.abs(operand)); },
        indX:  function(operand) { //Indirect indexed X - ($00+X)
            return this.read(this.zeroX(operand)) + (this.read(this.zeroX(operand+1)) * 256); },
        indY:  function(operand) { //Indirect indexed Y - ($00)+Y
            operand = this.readWord(operand);
            if ((operand&0xFF) + this.Y > 0xFF) this.tick++;
            return operand + this.Y; },
        
        //Helper function to convert signed bytes to javascript's native numbers
        cSignedByte: function(value) { return value>0x7F ? value-0x100 : value; },
        
        //== Instructions ===============================================//
        
        // Jump, subroutine and interrupt
        BRK: function(operand) { //Interrupt
            this.pushWord(this.PC);
            this.pushByte(this.P);
            this.PC = this.readWord(0xFFFE);
            var journal = this.journal;
            if (journal[journal.length-1]) journal.push(0);
        },
        RTI: function(operand) { //Return from Interrupt
            this.P = this.pullByte();
            this.PC = this.pullWord();
            var journal = this.journal;
            if (journal[journal.length-1]) journal.push(0);
        },
        JSR: function(operand) { //Jump to Subroutine
            this.pushWord(this.PC);
            this.PC = operand.call(this);
            var journal = this.journal;
            if (journal[journal.length-1]) journal.push(0);
        },
        RTS: function(operand) { //Return from Subroutine
            this.PC = this.pullWord() + 1;
            var journal = this.journal;
            if (journal[journal.length-1]) journal.push(0);
        },
        JMP: function(operand) { //Jump to
            this.PC = operand.call(this);
            var journal = this.journal;
            if (journal[journal.length-1]) journal.push(0);
        },
        
        // Branching
        BPL: function(operand) { //Branch if Positive
            if (!this.getNegative()) {
                this.PC = operand.call(this);
                this.tick++;
            }
            else this.PC++;
        },
        BMI: function(operand) { //Branch if Negative
            if (this.getNegative()) {
                this.PC = operand.call(this);
                this.tick++;
            }
            else this.PC++;
        },
        BVC: function(operand) { //Branch if oVerflow Clear
            if (!this.getOverflow()) {
                this.PC = operand.call(this);
                this.tick++;
            }
            else this.PC++;
        },
        BVS: function(operand) { //Branch if oVerflow Set
            if (this.getOverflow()) {
                this.PC = operand.call(this);
                this.tick++;
            }
            else this.PC++;
        },
        BCC: function(operand) { //Branch if Carry Clear
            if (!this.getCarry()) {
                this.PC = operand.call(this);
                this.tick++;
            }
            else this.PC++;
        },
        BCS: function(operand) { //Branch if Carry Set
            if (this.getCarry()) {
                this.PC = operand.call(this);
                this.tick++;
            }
            else this.PC++;
        },
        BNE: function(operand) { //Branch if Not Equal
            if (!this.getZero()) {
                this.PC = operand.call(this);
                this.tick++;
            }
            else this.PC++;
        },
        BEQ: function(operand) { //Branch if Equal
            if (this.getZero()) {
                this.PC = operand.call(this);
                this.tick++;
            }
            else this.PC++;
        },
        
        // Stack
        PHA: function(operand) { this.pushByte(this.A); }, //Push Accumulator
        PHP: function(operand) { this.pushByte(this.P); }, //Push Processor Status
        PLA: function(operand) { this.setA(this.pullByte()); }, //Pull Accumulator
        PLP: function(operand) { this.P = this.pullByte(); },   //Pull Processor Status
        
        // Status flags
        CLC: function(operand) { this.clrCarry(); },
        CLD: function(operand) { this.clrDecimal(); },
        CLI: function(operand) { this.clrInterrupt(); },
        CLV: function(operand) { this.clrOverflow(); },
        SEC: function(operand) { this.setCarry(true); },
        SED: function(operand) { this.setDecimal(); },
        SEI: function(operand) { this.setInterrupt(); },
        
        // Register transfert
        TAX: function(operand) { this.setX(this.A); }, //Transfert A to X
        TXA: function(operand) { this.setA(this.X); }, //Transfert X to A
        TAY: function(operand) { this.setY(this.A); }, //Transfert A to Y
        TYA: function(operand) { this.setA(this.Y); }, //Transfert Y to A
        TSX: function(operand) { this.setX(this.SP); }, //Transfert SP to X
        TXS: function(operand) { this.SP = this.X; },   //Transfert X to SP
        
        // Move operations
        LDA: function(operand) { this.setA(this.read(operand.call(this))); this.PC++; }, //Load Accumulator
        LDX: function(operand) { this.setX(this.read(operand.call(this))); this.PC++; }, //Load X
        LDY: function(operand) { this.setY(this.read(operand.call(this))); this.PC++; }, //Load Y
        STA: function(operand) { this.write(operand.call(this), this.A); this.PC++; }, //Store Accumulator
        STX: function(operand) { this.write(operand.call(this), this.X); this.PC++; }, //Store X
        STY: function(operand) { this.write(operand.call(this), this.Y); this.PC++; }, //Store Y
        
        // Arithmetic operations
        ADC: function(operand) { //Add with Carry
            operand = this.read(operand.call(this)) + this.getCarry();
            var a = this.A;
            var alu = a + operand;
            this.setOverflow((a^alu) & (operand^alu) & 0x80);
            if (this.setCarry(this.setA(alu)>0xFF)) this.A-=0x100;
            this.PC++;
        },
        SBC: function(operand) { //Subtract with Carry
            operand = 0x100 - this.read(operand.call(this)) - this.getCarry();
            var a = this.A;
            var alu = a + operand;
            this.setOverflow((a^alu) & (operand^alu) & 0x80);
            if (this.setCarry(this.setA(alu)>0xFF)) this.A-=0x100;
            this.PC++;
        },
        ASL: function(operand) { //Arithmetic Shift Left
            operand = operand.call(this);
            if (operand===null) { //Opcode $0A is implied
                this.setA(this.A*2);
                if (this.setCarry(this.A>0xFF)) { this.A-=0x100; }
            } else {
                var alu = this.setZNFlags(this.read(operand)*2);
                if (this.setCarry(alu>0xFF)) { alu-=0x100; }
                this.write(operand, alu);
                this.PC++;
            }
        },
        LSR: function(operand) { //Logical Shift Right
            operand = operand.call(this);
            if (operand===null) { //Opcode $4A is implied
                if (this.setCarry(this.A%2)) { this.A-=1; }
                this.setA(this.A/2);
            } else {
                var alu = this.read(operand);
                if (this.setCarry(alu%2)) { alu-=1; }
                this.write(operand, this.setZNFlags(alu/2));
                this.PC++;
            }
        },
        ROL: function(operand) { //Rotate Left
            operand = operand.call(this);
            if (operand===null) { //Opcode $2A is implied
                this.setA(this.A*2+this.getCarry());
                if (this.setCarry(this.A>0xFF)) { this.A-=0x100; }
            } else {
                var alu = this.setZNFlags(this.read(operand)*2+this.getCarry());
                if (this.setCarry(alu>0xFF)) { alu-=0x100; }
                this.write(operand, alu);
                this.PC++;
            }
        },
        ROR: function(operand) { //Rotate Right
            operand = operand.call(this);
            var alu;
            if (operand===null) { //Opcode $6A is implied
                alu = this.A+(this.getCarry()*0x100);
                if (this.setCarry(alu%2)) { alu-=1; }
                this.setA(alu/2);
            } else {
                alu = this.read(operand)+(this.getCarry()*0x100);
                if (this.setCarry(alu%2)) { alu-=1; }
                this.write(operand, this.setZNFlags(alu/2));
                this.PC++;
            }
        },
        
        INC: function(operand) { //Increment memory
            operand = operand.call(this);
            this.write(operand, this.setZNFlags(this.read(operand)+1));
            this.PC++;
        },
        DEC: function(operand) { //Decrement memory
            operand = operand.call(this);
            this.write(operand, this.setZNFlags(this.read(operand)-1));
            this.PC++;
        },
        INX: function(operand) { //Increment X
            var x = this.X;
            this.setX((x<0xFF) ? x+1 : 0x00);
        },
        DEX: function(operand) { //Decrement X
            var x = this.X;
            this.setX((x>0x00) ? x-1 : 0xFF);
        },
        INY: function(operand) { //Increment Y
            var y = this.Y;
            this.setY((y<0xFF) ? y+1 : 0x00);
        },
        DEY: function(operand) { //Decrement Y
            var y = this.Y;
            this.setY((y>0x00) ? y-1 : 0xFF);
        },
        
        BIT: function(operand) { //Bit test
            var alu = this.read(operand.call(this));
            if (this.setNegative(alu>0x7F)) {
                this.setOverflow(alu>0xBF);
            } else {
                this.setOverflow(alu>0x3F);
            }
            this.setZero(!(this.A&alu));
            this.PC++;
        },
        CMP: function(operand) { //Compare with Accumulator
            var a = this.A;
            var alu = this.setZNFlags(this.read(operand.call(this)));
            this.setCarry(a>=alu);
            this.setZero(a==alu);
        },
        CPX: function(operand) { //Compare with X
            var x = this.X;
            var alu = this.setZNFlags(this.read(operand.call(this)));
            this.setCarry(x>=alu);
            this.setZero(x==alu);
        },
        CPY: function(operand) { //Compare with Y
            var y = this.Y;
            var alu = this.setZNFlags(this.read(operand.call(this)));
            this.setCarry(y>=alu);
            this.setZero(y==alu);
        },
        
        // Logical operations
        ORA: function(operand) { this.setA(this.A | this.read(operand.call(this))); this.PC++; }, //Logical OR
        AND: function(operand) { this.setA(this.A & this.read(operand.call(this))); this.PC++; }, //Logical AND
        EOR: function(operand) { this.setA(this.A ^ this.read(operand.call(this))); this.PC++; }, //Exclusive OR
        
        // Others
        NOP: function(operand) { operand.call(this); }, //Does nothing
        KIL: function(operand) { this.doRESET(); }      //Crashes the machine!
    }
    
    Nestled.Cpu = Cpu;
})(window.Nestled = window.Nestled || {});
