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
        
        //Initial RESET
        if (this.cartridge) { this.doRESET(); }
    }

    Cpu.prototype = {
        constructor: Cpu,
        
        tickPerFrame: 21477272/12/60, //Hardcoded to NTSC for now...
        
        //== Main loop ==================================================//
        emulateFrame: function() {
            if (!this.busy) {
                this.busy = true;
                while(this.tick<=this.tickPerFrame) {
                    this.opCodeLookup[this.read(this.PC)](
                        this.addressLookup[this.PC](this.read(++this.PC))
                    );
                }
                this.busy = false;
            }
        },
        
        //== Interrupts =================================================//
        doNMI: function() {
            this.pushWord(this.PC+=2);
            this.pushByte(this.P & ~0x10);
            this.PC = this.readWord(0xFFFA);
        },
        doRESET: function()  {
            this.SP = (this.SP+=3) & 0xFF;
            this.setInterrupt();
            this.PC = this.readWord(0xFFFC);
        },
        doIRQ: function()  {
            this.pushWord(this.PC+=2);
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
            this.ram[0x100 + (--this.SP & 0xFF)] = value;
        },
        pushWord: function(value) {
            this.ram[0x100 + (--this.SP & 0xFF)] = (value >> 8);
            this.ram[0x100 + (--this.SP & 0xFF)] = (value & 0xFF);
        },
        
        popByte: function() {
            return this.ram[0x100 + (this.SP++ & 0xFF)];
        },
        popWord: function() {
            return this.popByte + (this.popByte << 8);
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
        
        Implied: function(operand) {
        },
        Immediate: function(operand) {
        },
        Relative: function(operand) {
        },
        
        ZeroPage: function(operand) {
        },
        ZeroPageX: function(operand) { // Indexed
        },
        ZeroPageY: function(operand) { // Indexed
        },
        
        Absolute: function(operand) {
        },
        AbsoluteX: function(operand) { // Indexed
        },
        AbsoluteY: function(operand) { // Indexed
        },
        
        Indirect: function(operand) {
        },
        IndirectX: function(operand) { // Indexed indirect
        },
        IndirectY: function(operand) { // Indirect indexed
        },
        
        //== OpCodes ====================================================//
        
        // Jump, subroutine and interrupt
        BRK: function(operand) { //Break
        },
        RTI: function(operand) { //Return from Interrupt
        },
        JSR: function(operand) { //Jump to Subroutine
        },
        RTS: function(operand) { //Return from Subroutine
        },
        JMP: function(operand) { //Jump to
        },
        
        // Branching
        BPL: function(operand) { //Branch if Positive
        },
        BMI: function(operand) { //Branch if Negative
        },
        BVC: function(operand) { //Branch if oVerflow Clear
        },
        BVS: function(operand) { //Branch if oVerflow Set
        },
        BCC: function(operand) { //Branch if Carry Clear
        },
        BCS: function(operand) { //Branch if Carry Set
        },
        BNE: function(operand) { //Branch if Not Equal
        },
        BEQ: function(operand) { //Branch if Equal
        },
        
        // Stack
        PHP: function(operand) { //Push Processor Status
        },
        PLP: function(operand) { //Pull Processor Status
        },
        PHA: function(operand) { //Push Accumulator
        },
        PLA: function(operand) { //Pull Accumulator
        },
        
        // Status flags
        CLC: function(operand) { //Clear Carry
        },
        CLD: function(operand) { //Clear Decimal
        },
        CLI: function(operand) { //Clear Interrupt
        },
        CLV: function(operand) { //Clear oVerflow
        },
        SEC: function(operand) { //Set Carry
        },
        SED: function(operand) { //Set Decimal
        },
        SEI: function(operand) { //Set Interrupt
        },
        
        // Register transfert
        TAX: function(operand) { //Transfert A to X
        },
        TXA: function(operand) { //Transfert X to A
        },
        TAY: function(operand) { //Transfert A to Y
        },
        TYA: function(operand) { //Transfert Y to A
        },
        TSX: function(operand) { //Transfert SP to X
        },
        TXS: function(operand) { //Transfert X to SP
        },
        
        // Move operations
        LDA: function(operand) { //Load Accumulator
        },
        STA: function(operand) { //Store Accumulator
        },
        LDX: function(operand) { //Load X
        },
        STX: function(operand) { //Store X
        },
        LDY: function(operand) { //Load Y
        },
        STY: function(operand) { //Store Y
        },
        
        // Arithmetic operations
        ADC: function(operand) { //Add with Carry
        },
        SBC: function(operand) { //Subtract with Carry
        },
        ASL: function(operand) { //Arithmetic Shift Left
        },
        LSR: function(operand) { //Logical Shift Right
        },
        ROL: function(operand) { //Rotate Left
        },
        ROR: function(operand) { //Rotate Right
        },
        DEC: function(operand) { //Decrement any
        },
        DEX: function(operand) { //Decrement X
        },
        DEY: function(operand) { //Decrement Y
        },
        INC: function(operand) { //Increment any
        },
        INX: function(operand) { //Increment X
        },
        INY: function(operand) { //Increment Y
        },
        BIT: function(operand) { //Bit test
        },
        CMP: function(operand) { //Compare with Accumulator
        },
        CPX: function(operand) { //Compare with X
        },
        CPY: function(operand) { //Compare with Y
        },
        
        // Logical operations
        ORA: function(operand) { //Logical OR
        },
        AND: function(operand) { //Logical AND
        },
        EOR: function(operand) { //Exclusive OR
        },
        
        // Others
        NOP: function(operand) { //Do nothing
        },
        KIL: function(operand) { //Crashes the machine!
        }
    }
    
    Nestled.Cpu = Cpu;
})(window.Nestled = window.Nestled || {});
