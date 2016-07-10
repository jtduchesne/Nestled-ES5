"use strict";

(function(Nestled, undefined) {
    function Cpu(cartridge) {
        this.cartridge = cartridge;
        
        this.busy = true;
        this.tick = 0;
        
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
        //Program counter
        this.PC = 0;
        
        //RAM
        this.ram = new Array(0x800);
        
        //Pre-allocated buffers for opcode and operand fetch
        this.opcode = 0;
        this.operand = 0;
        
        //Pre-allocated buffer for arithmetic operations
        this.alu = 0;
        
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
        
        //Initial RESET
        if (this.cartridge) { this.doRESET(); }
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
        
        //== Main loop ==================================================//
        emulateFrame: function() {
            if (!this.busy) {
                this.busy = true;
                while(this.tick < this.ticksPerFrame)
                    doInstruction();
                this.tick -= this.ticksPerFrame;
                this.busy = false;
            }
        },
        doInstruction: function() {
            this.opcode  = this.read(this.PC++);
            this.operand = this.read(this.PC);
            this.instructionLookup[this.opcode].call(this, function() {
                return this.addressLookup[this.opcode].call(this, this.operand);
            });
            this.tick += this.cyclesLookup[this.opcode];
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
            if (address < 0x2000) {
                return this.ram[address & 0x7FF];
            } else if (address < 0x4018) {
                if (address < 0x4000)       { /* return this.ppu.read(address); */ }
                else if (address == 0x4016) { /* return this.joypad[0].read(); */ }
                else if (address == 0x4017) { /* return this.joypad[1].read(); */ }
                else                        { /* return this.apu.read(); */ }
            } else {
                return this.cartridge.read(address);
            }
        },
        readWord: function(address) {
            if (address < 0x2000) {
                address &= 0x7FF;
                return this.ram[address] + (this.ram[address+1] * 0x100);
            } else {
                return this.cartridge.readWord(address);
            }
        },
        write: function(address, data) {
            if (address < 0x2000) {
                this.ram[address & 0x7FF] = (data & 0xFF);
            } else if (address < 0x4018) {
                if (address < 0x4000)       { /* this.ppu.write(address,data); */ }
                else if (address == 0x4014) {
                    // for(var dma=data<<16;dma<0x100;dma++)
                    //     this.ppu.write(0x2004,this.read(dma));
                }
                else if (address == 0x4016) { /* (Joypads strobe); */ }
                else                        { /* this.apu.write(address,data); */ }
            } else {
                return this.cartridge.write(address, data);
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
            this.alu = this.ram[0x100 + this.SP]
            this.SP = this.SP+1 & 0xFF;
            return this.alu;
        },
        pullWord: function() {
            return this.pullByte() + (this.pullByte() << 8);
        },
        
        //== Registers ==================================================//
        
        setA:   function(value) { return this.setZNFlags(this.A = value); },
        setX:   function(value) { return this.setZNFlags(this.X = value); },
        setY:   function(value) { return this.setZNFlags(this.Y = value); },
        setALU: function(value) { return this.setZNFlags(this.alu = value); },
        
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
        },
        RTI: function(operand) { //Return from Interrupt
            this.P = this.pullByte();
            this.PC = this.pullWord();
        },
        JSR: function(operand) { //Jump to Subroutine
            this.pushWord(this.PC);
            this.PC = operand.call(this);
        },
        RTS: function(operand) { //Return from Subroutine
            this.PC = this.pullWord() + 1;
        },
        JMP: function(operand) { //Jump to
            this.PC = operand.call(this);
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
            this.ALU = this.A + operand;
            this.setOverflow((this.A^this.ALU) & (operand^this.ALU) & 0x80);
            if (this.setCarry(this.setA(this.ALU)>0xFF)) this.A-=0x100;
            this.PC++;
        },
        SBC: function(operand) { //Subtract with Carry
            operand = 0x100 - this.read(operand.call(this)) - this.getCarry();
            this.ALU = this.A + operand;
            this.setOverflow((this.A^this.ALU) & (operand^this.ALU) & 0x80);
            if (this.setCarry(this.setA(this.ALU)>0xFF)) this.A-=0x100;
            this.PC++;
        },
        ASL: function(operand) { //Arithmetic Shift Left
            operand = operand.call(this);
            if (operand===null) { //Opcode $0A is implied
                this.setA(this.A*2);
                if (this.setCarry(this.A>0xFF)) { this.A-=0x100; }
            } else {
                this.setALU(this.read(operand)*2);
                if (this.setCarry(this.alu>0xFF)) { this.alu-=0x100; }
                this.write(operand, this.alu);
                this.PC++;
            }
        },
        LSR: function(operand) { //Logical Shift Right
            operand = operand.call(this);
            if (operand===null) { //Opcode $4A is implied
                if (this.setCarry(this.A%2)) { this.A-=1; }
                this.setA(this.A/2);
            } else {
                this.alu = this.read(operand);
                if (this.setCarry(this.alu%2)) { this.alu-=1; }
                this.write(operand, this.setALU(this.alu/2));
                this.PC++;
            }
        },
        ROL: function(operand) { //Rotate Left
            operand = operand.call(this);
            if (operand===null) { //Opcode $2A is implied
                this.setA(this.A*2+this.getCarry());
                if (this.setCarry(this.A>0xFF)) { this.A-=0x100; }
            } else {
                this.setALU(this.read(operand)*2+this.getCarry());
                if (this.setCarry(this.alu>0xFF)) { this.alu-=0x100; }
                this.write(operand, this.alu);
                this.PC++;
            }
        },
        ROR: function(operand) { //Rotate Right
            operand = operand.call(this);
            if (operand===null) { //Opcode $6A is implied
                this.alu = this.A+(this.getCarry()*0x100);
                if (this.setCarry(this.alu%2)) { this.alu-=1; }
                this.setA(this.alu/2);
            } else {
                this.alu = this.read(operand)+(this.getCarry()*0x100);
                if (this.setCarry(this.alu%2)) { this.alu-=1; }
                this.write(operand, this.setALU(this.alu/2));
                this.PC++;
            }
        },
        
        INC: function(operand) { //Increment memory
            operand = operand.call(this);
            this.write(operand, this.setALU(this.read(operand)+1));
            this.PC++;
        },
        DEC: function(operand) { //Decrement memory
            operand = operand.call(this);
            this.write(operand, this.setALU(this.read(operand)-1));
            this.PC++;
        },
        INX: function(operand) { this.setX((this.X<0xFF) ? this.X+1 : 0x00); }, //Increment X
        DEX: function(operand) { this.setX((this.X>0x00) ? this.X-1 : 0xFF); }, //Decrement X
        INY: function(operand) { this.setY((this.Y<0xFF) ? this.Y+1 : 0x00); }, //Increment Y
        DEY: function(operand) { this.setY((this.Y>0x00) ? this.Y-1 : 0xFF); }, //Decrement Y
        
        BIT: function(operand) { //Bit test
            this.alu = this.read(operand.call(this));
            if (this.setNegative(this.alu>0x7F)) {
                this.setOverflow(this.alu>0xBF);
            } else {
                this.setOverflow(this.alu>0x3F);
            }
            this.setZero(!(this.A&this.alu));
            this.PC++;
        },
        CMP: function(operand) { //Compare with Accumulator
            this.setALU(this.read(operand.call(this)));
            this.setCarry(this.A>=this.alu);
            this.setZero(this.A==this.alu);
        },
        CPX: function(operand) { //Compare with X
            this.setALU(this.read(operand.call(this)));
            this.setCarry(this.X>=this.alu);
            this.setZero(this.X==this.alu);
        },
        CPY: function(operand) { //Compare with Y
            this.setALU(this.read(operand.call(this)));
            this.setCarry(this.Y>=this.alu);
            this.setZero(this.Y==this.alu);
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
