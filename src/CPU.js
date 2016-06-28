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
        
        //Initial RESET
        if (this.cartridge) { this.doRESET(); }
    }

    Cpu.prototype = {
        constructor: Cpu,
        
        ticksPerFrame: 21477272/12/60, //Hardcoded to NTSC for now...
        
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
            this.operand = this.read(this.PC++);
            this.instructionLookup[this.opcode].call(this, this.addressLookup[this.opcode].call(this, this.operand));
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
                this.ram[address & 0x7FF] = data;
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
        
        setA: function(value) {
            this.A = value;
            this.setZero(this.A==0);
            this.setNegative(this.A<0);
            return this.A;
        },
        setX: function(value) {
            this.X = value;
            this.setZero(this.X==0);
            this.setNegative(this.X<0);
            return this.X;
        },
        setY: function(value) {
            this.Y = value;
            this.setZero(this.Y==0);
            this.setNegative(this.Y<0);
            return this.Y;
        },
        //I put this here because the Z and N flags also seem to be set
        //everytime the ALU is used...
        setALU: function(value) {
            this.alu = value;
            this.setZero(this.alu==0);
            this.setNegative(this.alu<0);
            return this.alu;
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
        
        rel:   function(operand) { return this.PC+this.cSignedByte(operand); }, //Relative - ±#00
        
        zero:  function(operand) { return operand & 0xFF; },            //Zero Page - $00
        zeroX: function(operand) { return (operand + this.X) & 0xFF; }, //Zero Page indexed X - $00+X
        zeroY: function(operand) { return (operand + this.Y) & 0xFF; }, //Zero Page indexed Y - $00+Y
        
        abs:   function(operand) { return operand + (this.read(this.PC++) * 256); }, //Absolute - $0000
        absX:  function(operand) { return this.abs(operand) + this.X; },             //Absolute indexed X - $0000+X
        absY:  function(operand) { return this.abs(operand) + this.Y; },             //Absolute indexed Y - $0000+Y
        
        ind:   function(operand) { //Indirect - ($0000)
            return this.readWord(this.abs(operand)); },
        indX:  function(operand) { //Indirect indexed X - ($00+X)
            return this.read(this.zeroX(operand)) + (this.read(this.zeroX(operand+1)) * 256); },
        indY:  function(operand) { //Indirect indexed Y - ($00)+Y
            return this.readWord(operand) + this.Y; },
        
        //Helper function to convert signed bytes to javascript's native numbers
        cSignedByte: function(value) { return value>0x7F ? value-0x100 : value; },
        
        //== OpCodes ====================================================//
        
        // Jump, subroutine and interrupt
        BRK: function(operand) { //Break
            this.pushWord(this.PC+=2);
            this.pushByte(this.P);
            this.PC = this.readWord(0xFFFE);
        },
        RTI: function(operand) { //Return from Interrupt
            this.P = this.pullByte();
            this.PC = this.pullWord();
        },
        JSR: function(operand) { //Jump to Subroutine
            this.pushWord(this.PC+=2);
            this.PC = operand + this.read(++this.PC);
        },
        RTS: function(operand) { //Return from Subroutine
            this.PC = this.pullWord() + 1;
        },
        JMP: function(operand) { //Jump to
            this.PC = operand + this.read(++this.PC);
        },
        
        // Branching
        BPL: function(operand) { //Branch if Positive
            if (!this.getNegative()) { this.PC = operand; }
            else this.PC++;
        },
        BMI: function(operand) { //Branch if Negative
            if (this.getNegative()) { this.PC = operand; }
            else this.PC++;
        },
        BVC: function(operand) { //Branch if oVerflow Clear
            if (!this.getOverfow()) { this.PC = operand; }
            else this.PC++;
        },
        BVS: function(operand) { //Branch if oVerflow Set
            if (this.getOverfow()) { this.PC = operand; }
            else this.PC++;
        },
        BCC: function(operand) { //Branch if Carry Clear
            if (!this.getCarry()) { this.PC = operand; }
            else this.PC++;
        },
        BCS: function(operand) { //Branch if Carry Set
            if (this.getCarry()) { this.PC = operand; }
            else this.PC++;
        },
        BNE: function(operand) { //Branch if Not Equal
            if (!this.getZero()) { this.PC = operand; }
            else this.PC++;
        },
        BEQ: function(operand) { //Branch if Equal
            if (this.getZero()) { this.PC = operand; }
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
        LDA: function(operand) { this.setA(this.read(operand)); }, //Load Accumulator
        LDX: function(operand) { this.setX(this.read(operand)); }, //Load X
        LDY: function(operand) { this.setY(this.read(operand)); }, //Load Y
        STA: function(operand) { this.write(operand, this.A); }, //Store Accumulator
        STX: function(operand) { this.write(operand, this.X); }, //Store X
        STY: function(operand) { this.write(operand, this.Y); }, //Store Y
        
        // Arithmetic operations
        ADC: function(operand) { //Add with Carry
            this.setA(this.A+this.cSignedByte(this.read(operand))+this.getCarry());
            if (this.setCarry(this.setOverflow(this.A>0x7F))) { this.A-=0x80; }
        },
        SBC: function(operand) { //Subtract with Carry
            this.setA(this.A-this.cSignedByte(this.read(operand))-(1-this.getCarry()));
            if (this.setCarry(!this.setOverflow(this.A>0x7F))) { this.A-=0x80; }
        },
        ASL: function(operand) { //Arithmetic Shift Left
            if (operand===null) { //Opcode $0A uses the accumulator
                this.setA(this.A*2);
                if (this.setCarry(this.A>0xFF)) { this.A-=0x100; }
            } else {
                this.setALU(this.read(operand)*2);
                if (this.setCarry(this.alu>0xFF)) { this.alu-=0x100; }
                this.write(operand, this.alu);
            }
        },
        LSR: function(operand) { //Logical Shift Right
            if (operand===null) { //Opcode $4A uses the accumulator
                if (this.setCarry(this.A%2)) { this.A-=1; }
                this.setA(this.A/2);
            } else {
                this.alu = this.read(operand);
                if (this.setCarry(this.alu%2)) { this.alu-=1; }
                this.write(operand, this.setALU(this.alu/2));
            }
        },
        ROL: function(operand) { //Rotate Left
            if (operand===null) { //Opcode $2A uses the accumulator
                this.setA(this.A*2+this.getCarry());
                if (this.setCarry(this.A>0xFF)) { this.A-=0x100; }
            } else {
                this.setALU(this.read(operand)*2+this.getCarry());
                if (this.setCarry(this.alu>0xFF)) { this.alu-=0x100; }
                this.write(operand, this.alu);
            }
        },
        ROR: function(operand) { //Rotate Right
            if (operand===null) { //Opcode $6A uses the accumulator
                this.alu = this.A+(this.getCarry()*0x100);
                if (this.setCarry(this.alu%2)) { this.alu-=1; }
                this.setA(this.alu/2);
            } else {
                this.alu = this.read(operand)+(this.getCarry()*0x100);
                if (this.setCarry(this.alu%2)) { this.alu-=1; }
                this.write(operand, this.setALU(this.alu/2));
            }
        },
        
        INC: function(operand) { this.write(this.setALU(this.read(operand)+1)); }, //Increment memory
        DEC: function(operand) { this.write(this.setALU(this.read(operand)-1)); }, //Decrement memory
        INX: function(operand) { this.setX(this.X+1); }, //Increment X
        DEX: function(operand) { this.setX(this.X-1); }, //Decrement X
        INY: function(operand) { this.setY(this.Y+1); }, //Increment Y
        DEY: function(operand) { this.setY(this.Y-1); }, //Decrement Y
        
        BIT: function(operand) { //Bit test
            this.alu = this.read(operand);
            if (this.setNegative(this.alu>0x7F)) {
                this.setOverflow(this.alu>0x3F);
            } else {
                this.setOverflow(this.alu>0xBF);
            }
            this.setZero(!(this.A&this.alu));
        },
        CMP: function(operand) { //Compare with Accumulator
            this.alu = this.read(operand);
            this.setCarry(this.A>=this.alu);
            this.setZero(this.A==this.alu);
            this.setNegative(this.alu<0);
        },
        CPX: function(operand) { //Compare with X
            this.alu = this.read(operand);
            this.setCarry(this.X>=this.alu);
            this.setZero(this.X==this.alu);
            this.setNegative(this.alu<0);
        },
        CPY: function(operand) { //Compare with Y
            this.alu = this.read(operand);
            this.setCarry(this.Y>=this.alu);
            this.setZero(this.Y==this.alu);
            this.setNegative(this.alu<0);
        },
        
        // Logical operations
        ORA: function(operand) { this.setA(this.A|this.read(operand)); }, //Logical OR
        AND: function(operand) { this.setA(this.A&this.read(operand)); }, //Logical AND
        EOR: function(operand) { this.setA(this.A^this.read(operand)); }, //Exclusive OR
        
        // Others
        NOP: function(operand) { return; }, //Do nothing
        KIL: function(operand) { this.doRESET(); }, //Crashes the machine!
        
        opCodeLookup: [
            Cpu.BRK, Cpu.ORA, Cpu.KIL, Cpu.NOP, Cpu.NOP, Cpu.ORA, Cpu.ASL, Cpu.NOP, Cpu.PHP, Cpu.ORA, Cpu.ASL, Cpu.NOP, Cpu.NOP, Cpu.ORA, Cpu.ASL, Cpu.NOP,
            Cpu.BPL, Cpu.ORA, Cpu.KIL, Cpu.NOP, Cpu.NOP, Cpu.ORA, Cpu.ASL, Cpu.NOP, Cpu.CLC, Cpu.ORA, Cpu.NOP, Cpu.NOP, Cpu.NOP, Cpu.ORA, Cpu.ASL, Cpu.NOP,
            Cpu.JSR, Cpu.AND, Cpu.KIL, Cpu.NOP, Cpu.BIT, Cpu.AND, Cpu.ROL, Cpu.NOP, Cpu.PLP, Cpu.AND, Cpu.ROL, Cpu.NOP, Cpu.BIT, Cpu.AND, Cpu.ROL, Cpu.NOP,
            Cpu.BMI, Cpu.AND, Cpu.KIL, Cpu.NOP, Cpu.NOP, Cpu.AND, Cpu.ROL, Cpu.NOP, Cpu.SEC, Cpu.AND, Cpu.NOP, Cpu.NOP, Cpu.NOP, Cpu.AND, Cpu.ROL, Cpu.NOP,
            Cpu.RTI, Cpu.EOR, Cpu.KIL, Cpu.NOP, Cpu.NOP, Cpu.EOR, Cpu.LSR, Cpu.NOP, Cpu.PHA, Cpu.EOR, Cpu.LSR, Cpu.NOP, Cpu.JMP, Cpu.EOR, Cpu.LSR, Cpu.NOP,
            Cpu.BVC, Cpu.EOR, Cpu.KIL, Cpu.NOP, Cpu.NOP, Cpu.EOR, Cpu.LSR, Cpu.NOP, Cpu.CLI, Cpu.EOR, Cpu.NOP, Cpu.NOP, Cpu.NOP, Cpu.EOR, Cpu.LSR, Cpu.NOP,
            Cpu.RTS, Cpu.ADC, Cpu.KIL, Cpu.NOP, Cpu.NOP, Cpu.ADC, Cpu.ROR, Cpu.NOP, Cpu.PLA, Cpu.ADC, Cpu.ROR, Cpu.NOP, Cpu.JMP, Cpu.ADC, Cpu.ROR, Cpu.NOP,
            Cpu.BVS, Cpu.ADC, Cpu.KIL, Cpu.NOP, Cpu.NOP, Cpu.ADC, Cpu.ROR, Cpu.NOP, Cpu.SEI, Cpu.ADC, Cpu.NOP, Cpu.NOP, Cpu.NOP, Cpu.ADC, Cpu.ROR, Cpu.NOP,
            Cpu.NOP, Cpu.STA, Cpu.NOP, Cpu.NOP, Cpu.STY, Cpu.STA, Cpu.STX, Cpu.NOP, Cpu.DEY, Cpu.NOP, Cpu.TXA, Cpu.NOP, Cpu.STY, Cpu.STA, Cpu.STX, Cpu.NOP,
            Cpu.BCC, Cpu.STA, Cpu.KIL, Cpu.NOP, Cpu.STY, Cpu.STA, Cpu.STX, Cpu.NOP, Cpu.TYA, Cpu.STA, Cpu.TXS, Cpu.NOP, Cpu.SHY, Cpu.STA, Cpu.SHX, Cpu.NOP,
            Cpu.LDY, Cpu.LDA, Cpu.LDX, Cpu.NOP, Cpu.LDY, Cpu.LDA, Cpu.LDX, Cpu.NOP, Cpu.TAY, Cpu.LDA, Cpu.TAX, Cpu.NOP, Cpu.LDY, Cpu.LDA, Cpu.LDX, Cpu.NOP,
            Cpu.BCS, Cpu.LDA, Cpu.KIL, Cpu.NOP, Cpu.LDY, Cpu.LDA, Cpu.LDX, Cpu.NOP, Cpu.CLV, Cpu.LDA, Cpu.TSX, Cpu.NOP, Cpu.LDY, Cpu.LDA, Cpu.LDX, Cpu.NOP,
            Cpu.CPY, Cpu.CMP, Cpu.NOP, Cpu.NOP, Cpu.CPY, Cpu.CMP, Cpu.DEC, Cpu.NOP, Cpu.INY, Cpu.CMP, Cpu.DEX, Cpu.NOP, Cpu.CPY, Cpu.CMP, Cpu.DEC, Cpu.NOP,
            Cpu.BNE, Cpu.CMP, Cpu.KIL, Cpu.NOP, Cpu.NOP, Cpu.CMP, Cpu.DEC, Cpu.NOP, Cpu.CLD, Cpu.CMP, Cpu.NOP, Cpu.NOP, Cpu.NOP, Cpu.CMP, Cpu.DEC, Cpu.NOP,
            Cpu.CPX, Cpu.SBC, Cpu.NOP, Cpu.NOP, Cpu.CPX, Cpu.SBC, Cpu.INC, Cpu.NOP, Cpu.INX, Cpu.SBC, Cpu.NOP, Cpu.NOP, Cpu.CPX, Cpu.SBC, Cpu.INC, Cpu.NOP,
            Cpu.BEQ, Cpu.SBC, Cpu.KIL, Cpu.NOP, Cpu.NOP, Cpu.SBC, Cpu.INC, Cpu.NOP, Cpu.SED, Cpu.SBC, Cpu.NOP, Cpu.NOP, Cpu.NOP, Cpu.SBC, Cpu.INC, Cpu.NOP
        ],
        
    }
    
    Nestled.Cpu = Cpu;
})(window.Nestled = window.Nestled || {});
