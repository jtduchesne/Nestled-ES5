var expect = chai.expect;

describe("Nestled", function() {
    describe(".Cpu", function() {
        var subject, cartridge;
        var ram    =  [0x10,0x11,0x12,0x13];
        var sram   =  [0x20,0x21,0x22,0x23];
        var PRGRom = [[0x30,0x31,0x32,0x33,0x00,0x80],Array(0x4000)];
        PRGRom[1][0x3FFB] = 0x12; //NMI vector
        PRGRom[1][0x3FFA] = 0x34;
        PRGRom[1][0x3FFD] = 0x56; //RESET vector
        PRGRom[1][0x3FFC] = 0x78;
        PRGRom[1][0x3FFF] = 0x9A; //IRQ vector
        PRGRom[1][0x3FFE] = 0xBC;
        
        beforeEach(function() {
            cartridge = new Nestled.Cartridge({sram: sram.slice(0), PRGRom: PRGRom});
            subject   = new Nestled.Cpu(cartridge);
            subject.ram = ram.slice(0);
        });
        
        it("can be turned on",  function() { expect(subject).to.respondTo('powerOn'); });
        it("can be turned off", function() { expect(subject).to.respondTo('powerOff'); });
        
        //-------------------------------------------------------------------------------//
        
        context("without a cartridge", function() {
            beforeEach(function() { subject.disconnectCartridge(); });
            
            it("can still boot", function() {
                expect(subject.doRESET.bind(subject)).not.to.throw(Error); });
            it("can still be read", function() {
                expect(subject.read.bind(subject, 0x8000)).not.to.throw(Error);
                expect(subject.read(0x8000)).not.to.be.undefined;
                expect(subject.readWord.bind(subject, 0x8000)).not.to.throw(Error);
                expect(subject.readWord(0x8000)).not.to.be.undefined; });
        });
        
        //-------------------------------------------------------------------------------//
        
        describe("#powerOn()", function() {
            beforeEach(function() { subject.powerOn(); });
            
            it("sets isPowered", function() { expect(subject.isPowered).to.be.true });
            
            it("sets A to 0", function() { expect(subject.A).to.equal(0); });
            it("sets X to 0", function() { expect(subject.X).to.equal(0); });
            it("sets Y to 0", function() { expect(subject.Y).to.equal(0); });
            it("sets P to 0x34", function()  { expect(subject.P).to.equal(0x34); });
            it("sets the I flag", function() { expect(subject.getInterrupt()).to.be.truthy; });
            it("sets SP to 0x00", function() { expect(subject.SP).to.equal(0x00); });
        });
        
        describe("#powerOff()", function() {
            beforeEach(function() { subject.powerOff(); });
            
            it("clears isPowered", function() { expect(subject.isPowered).to.be.false });
        });
        
        //-------------------------------------------------------------------------------//
        
        describe("#connectCartridge(cartridge)", function() {
            var cartridge = "cartridge";
            beforeEach(function() { subject.connectCartridge(cartridge); });
            
            it("connects the cartridge", function() {
                expect(subject.cartridge).to.eql(cartridge); });
            it("returns the cartridge", function() {
                expect(subject.connectCartridge(cartridge)).to.eql(cartridge); });
        });
        describe("#disconnectCartridge()", function() {
            var cartridge = "cartridge";
            beforeEach(function() {
                subject.cartridge = cartridge;
                subject.disconnectCartridge();
            });
            
            it("disconnects the cartridge", function() {
                expect(subject.cartridge).not.to.eql(cartridge); });
            it("returns an empty cartridge", function() {
                expect(subject.disconnectCartridge()).to.be.an.instanceof(Nestled.Cartridge); });
        });
        
        //-------------------------------------------------------------------------------//
        
        describe("#doNMI()", function() {
            beforeEach(function() { subject.doNMI(); });
            
            it("pushes P with BRK flag cleared", function() {
                expect(subject.pullByte() & 0x10).to.equal(0); });
            it("sets PC to NMI vector (0xFFFA)", function() {
                expect(subject.PC).to.equal(0x1234); });
        });
        describe("#doRESET()", function() {
            beforeEach(function() { subject.doRESET(); });
            
            it("sets PC to RESET vector (0xFFFC)", function() {
                expect(subject.PC).to.equal(0x5678); });
        });
        describe("#doIRQ()", function() {
            beforeEach(function() { subject.doIRQ(); });
            
            it("pushes P with BRK flag cleared", function() {
                expect(subject.pullByte() & 0x10).to.equal(0); });
            it("sets PC to IRQ vector (0xFFFE)", function() {
                expect(subject.PC).to.equal(0x9ABC); });
        });
        
        //-------------------------------------------------------------------------------//
        
        describe("#read(address)", function() {
            it("reads from RAM when address is between [0x0000, 0x07FF]", function() {
                expect(subject.read(0x0001)).to.equal(0x11); });
            it("reads from SRAM when address is between [0x6000, 0x7FFF]", function() {
                expect(subject.read(0x6002)).to.equal(0x22); });
            it("reads from PRG-ROM when address is between [0x8000, 0xFFFF]", function() {
                expect(subject.read(0x8003)).to.equal(0x33); });
            it("returns zero instead of undefined", function() {
                expect(subject.read(0x07FF)).to.equal(0); });
        });
        describe("#readWord(address)", function() {
            it("reads from RAM when address is between [0x0000, 0x07FF]", function() {
                expect(subject.readWord(0x0000)).to.equal(0x1110); });
            it("reads from SRAM when address is between [0x6000, 0x7FFF]", function() {
                expect(subject.readWord(0x6001)).to.equal(0x2221); });
            it("reads from PRG-ROM when address is between [0x8000, 0xFFFF]", function() {
                expect(subject.readWord(0x8002)).to.equal(0x3332); });
            it("returns zero instead of undefined", function() {
                expect(subject.readWord(0x07FE)).to.equal(0); });
        });
        describe("#write(address,data)", function() {
            it("writes to RAM when address is between [0x0000, 0x07FF]", function() {
                subject.write(0x000, 0xFF);
                expect(subject).to.have.deep.property('ram[0]', 0xFF); });
            it("writes to SRAM when address is between [0x6000, 0x7FFF]", function() {
                subject.write(0x6000, 0xFF);
                expect(subject.cartridge).to.have.deep.property('sram[0]', 0xFF); });
        });
        
        //-------------------------------------------------------------------------------//
        
        context("Stack", function() {
            var prevSP;
            beforeEach(function() {
                subject.powerOn();
                prevSP = subject.SP;
            });
            
            describe("#pushByte(value)", function() {
                beforeEach(function() { subject.pushByte(0xEF); });
                
                it("decrements SP once", function() {
                    expect(subject.SP).to.equal((prevSP-1) & 0xFF); });
                it("writes to 0x1FF the first time", function() {
                    expect(subject).to.have.deep.property('ram[511]', 0xEF); });
                it("writes to 0x1FE the second time", function() {
                    subject.pushByte(0xCD);
                    expect(subject).to.have.deep.property('ram[510]', 0xCD); });
            });
            describe("#pushWord(value)", function() {
                beforeEach(function() { subject.pushWord(0xCDEF); });
                
                it("decrements SP twice", function() {
                    expect(subject.SP).to.equal((prevSP-2) & 0xFF); });
                it("writes to [0x1FE,0x1FF] the first time", function() {
                    expect(subject).to.have.deep.property('ram[511]', 0xCD);
                    expect(subject).to.have.deep.property('ram[510]', 0xEF);
                });
                it("writes to [0x1FC,0x1FD] the second time", function() {
                    subject.pushWord(0x89AB);
                    expect(subject).to.have.deep.property('ram[509]', 0x89);
                    expect(subject).to.have.deep.property('ram[508]', 0xAB);
                });
            });
            describe("#pullByte()", function() {
                beforeEach(function() {
                    subject.pushByte(0xEF);
                    subject.pushByte(0xCD);
                    prevSP = subject.SP;
                });
                
                it("increments SP", function() {
                    subject.pullByte();
                    expect(subject.SP).to.equal((prevSP+1) & 0xFF)
                });
                it("returns the last pushed byte the first time", function() {
                    expect(subject.pullByte()).to.equal(0xCD);
                });
                it("returns the previous pushed byte the second time", function() {
                    subject.pullByte();
                    expect(subject.pullByte()).to.equal(0xEF);
                });
            });
            describe("#pullWord()", function() {
                beforeEach(function() {
                    subject.pushWord(0xCDEF);
                    subject.pushWord(0x89AB);
                    prevSP = subject.SP;
                });
                
                it("increments SP twice", function() {
                    subject.pullWord();
                    expect(subject.SP).to.equal((prevSP+2) & 0xFF)
                });
                it("returns the last pushed word the first time", function() {
                    expect(subject.pullWord()).to.equal(0x89AB);
                });
                it("returns the previous pushed word the second time", function() {
                    subject.pullWord();
                    expect(subject.pullWord()).to.equal(0xCDEF);
                });
            });
        });
        
        //-------------------------------------------------------------------------------//
        
        context("Status register", function() {
            beforeEach(function() { subject.P = 0x00; });
            
            describe("#getCarry()", function() {
                it("is truthy if Carry flag is set", function() {
                    subject.P = 0x01;
                    expect(subject.getCarry()).to.be.truthy; });
                it("is not truthy if Carry flag is clear", function() {
                    subject.P = ~0x01;
                    expect(subject.getCarry()).not.to.be.truthy; });
            });
            describe("#getZero()", function() {
                it("is truthy if Zero flag is set", function() {
                    subject.P = 0x02;
                    expect(subject.getZero()).to.be.truthy; });
                it("is not truthy if Zero flag is clear", function() {
                    subject.P = ~0x02;
                    expect(subject.getZero()).not.to.be.truthy; });
            });
            describe("#getInterrupt()", function() {
                it("is truthy if Interrupt Disable flag is set", function() {
                    subject.P = 0x04;
                    expect(subject.getInterrupt()).to.be.truthy; });
                it("is not truthy if Interrupt Disable flag is clear", function() {
                    subject.P = ~0x04;
                    expect(subject.getInterrupt()).not.to.be.truthy; });
            });
            describe("#getDecimal()", function() {
                it("is truthy if Decimal flag is set", function() {
                    subject.P = 0x08;
                    expect(subject.getDecimal()).to.be.truthy; });
                it("is not truthy if Decimal flag is clear", function() {
                    subject.P = ~0x08;
                    expect(subject.getDecimal()).not.to.be.truthy; });
            });
            describe("#getOverflow()", function() {
                it("is truthy if Overflow flag is set", function() {
                    subject.P = 0x40;
                    expect(subject.getOverflow()).to.be.truthy; });
                it("is not truthy if Overflow flag is clear", function() {
                    subject.P = ~0x40;
                    expect(subject.getOverflow()).not.to.be.truthy; });
            });
            describe("#getNegative()", function() {
                it("is truthy if Negative flag is set", function() {
                    subject.P = 0x80;
                    expect(subject.getNegative()).to.be.truthy; });
                it("is not truthy if Negative flag is clear", function() {
                    subject.P = ~0x80;
                    expect(subject.getNegative()).not.to.be.truthy; });
            });
            
            describe("#setCarry(value)", function() {
                it("sets Carry flag to the given value", function() {
                    subject.setCarry(true);
                    expect(subject.P & 0x01).to.be.truthy;
                    subject.setCarry(false);
                    expect(subject.P & 0x01).to.be.falsy;
                });
                it("returns the state of Carry flag", function() {
                    expect(subject.setCarry(true)).to.be.true;
                    expect(subject.setCarry(false)).to.be.false;
                });
            });
            describe("#setZero(value)", function() {
                it("sets Zero flag to the given value", function() {
                    subject.setZero(true);
                    expect(subject.P & 0x02).to.be.truthy;
                    subject.setZero(false);
                    expect(subject.P & 0x02).to.be.falsy;
                });
                it("returns the state of Zero flag", function() {
                    expect(subject.setZero(true)).to.be.true;
                    expect(subject.setZero(false)).to.be.false;
                });
            });
            describe("#setInterrupt()", function() {
                it("sets Interrupt Disable flag", function() {
                    subject.setInterrupt();
                    expect(subject.P & 0x04).to.be.truthy;
                });
                it("returns the state of Interrupt Disable flag", function() {
                    expect(subject.setInterrupt()).to.be.true;
                });
            });
            describe("#setDecimal()", function() {
                it("sets Decimal flag", function() {
                    subject.setDecimal();
                    expect(subject.P & 0x08).to.be.truthy;
                });
                it("returns the state of Decimal flag", function() {
                    expect(subject.setDecimal()).to.be.true;
                });
            });
            describe("#setOverflow(value)", function() {
                it("sets Overflow flag to the given value", function() {
                    subject.setOverflow(true);
                    expect(subject.P & 0x40).to.be.truthy;
                    subject.setOverflow(false);
                    expect(subject.P & 0x40).to.be.falsy;
                });
                it("returns the state of Overflow flag", function() {
                    expect(subject.setOverflow(true)).to.be.true;
                    expect(subject.setOverflow(false)).to.be.false;
                });
            });
            describe("#setNegative(value)", function() {
                it("sets Negative flag to the given value", function() {
                    subject.setNegative(true);
                    expect(subject.P & 0x80).to.be.truthy;
                    subject.setNegative(false);
                    expect(subject.P & 0x80).to.be.falsy;
                });
                it("returns the state of Negative flag", function() {
                    expect(subject.setNegative(true)).to.be.true;
                    expect(subject.setNegative(false)).to.be.false;
                });
            });
            
            describe("#clrCarry()", function() {
                it("clears Carry flag", function() {
                    subject.P = 0xFF;
                    subject.clrCarry();
                    expect(subject.P & 0x01).to.be.falsy; });
                it("returns false", function() {
                    expect(subject.clrCarry()).to.be.false; });
            });
            describe("#clrZero()", function() {
                it("clears Zero flag", function() {
                    subject.P = 0xFF;
                    subject.clrZero();
                    expect(subject.P & 0x02).to.be.falsy; });
                it("returns false", function() {
                    expect(subject.clrZero()).to.be.false; });
            });
            describe("#clrInterrupt()", function() {
                it("clears Interrupt Disable flag", function() {
                    subject.P = 0xFF;
                    subject.clrInterrupt();
                    expect(subject.P & 0x04).to.be.falsy; });
                it("returns false", function() {
                    expect(subject.clrInterrupt()).to.be.false; });
            });
            describe("#clrDecimal()", function() {
                it("clears Decimal flag", function() {
                    subject.P = 0xFF;
                    subject.clrDecimal();
                    expect(subject.P & 0x08).to.be.falsy; });
                it("returns false", function() {
                    expect(subject.clrDecimal()).to.be.false; });
            });
            describe("#clrOverflow()", function() {
                it("clears Overflow flag", function() {
                    subject.P = 0xFF;
                    subject.clrOverflow();
                    expect(subject.P & 0x40).to.be.falsy; });
                it("returns false", function() {
                    expect(subject.clrOverflow()).to.be.false; });
            });
            describe("#clrNegative()", function() {
                it("clears Negative flag", function() {
                    subject.P = 0xFF;
                    subject.clrNegative();
                    expect(subject.P & 0x80).to.be.falsy; });
                it("returns false", function() {
                    expect(subject.clrNegative()).to.be.false; });
            });
        });
        
        //-------------------------------------------------------------------------------//
        
        context("Addressing modes", function() {
            //They all should return the actual address of the next read
            var operand;
            beforeEach(function() { subject.PC = 0x8000; });
            
            describe("#imp()", function() {
                it("returns null", function() {
                    expect(subject.imp()).to.be.null; });
            });
            describe("#imm()", function() {
                it("returns #PC", function() {
                    expect(subject.imm()).to.equal(0x8000); });
            });
            
            describe("#rel(operand)", function() { //PC will be incremented once
                it("makes PC go forward with a positive operand", function() {
                    expect(subject.rel(1)).to.equal(0x8002) });
                it("makes PC go forward with a positive signed byte", function() {
                    expect(subject.rel(0x01)).to.equal(0x8002) });
                it("makes PC go backward with a negative operand", function() {
                    expect(subject.rel(-1)).to.equal(0x8000) });
                it("makes PC go backward with a negative signed byte", function() {
                    expect(subject.rel(0xFF)).to.equal(0x8000) });
            });
            
            describe("#zero(operand)", function() {
                it("returns the operand", function() {
                    expect(subject.zero(0x18)).to.equal(0x0018);
                });
            });
            describe("#zeroX(operand)", function() {
                it("returns the operand + X", function() {
                    subject.X = 0x80;
                    expect(subject.zeroX(0x18)).to.equal(0x0098);
                });
                it("cannot cross page", function() {
                    subject.X = 0xF0;
                    expect(subject.zeroX(0x18)).to.equal(0x0008);
                });
            });
            describe("#zeroY(operand)", function() {
                it("returns the operand + Y", function() {
                    subject.Y = 0xC0;
                    expect(subject.zeroY(0x18)).to.equal(0x00D8);
                });
                it("cannot cross page", function() {
                    subject.Y = 0xF0;
                    expect(subject.zeroY(0x18)).to.equal(0x0008);
                });
            });
            
            describe("#abs(operand)", function() {
                beforeEach(function() { operand = subject.read(subject.PC); });
                
                it("returns the operand(word)", function() {
                    expect(subject.abs(operand)).to.equal(0x3130); });
            });
            describe("#absX(operand)", function() {
                beforeEach(function() {
                    subject.X = 0xE0;
                    operand = subject.read(subject.PC);
                });
                
                it("returns the operand(word)", function() {
                    expect(subject.absX(operand)).to.equal(0x3210); });
            });
            describe("#absY(operand)", function() {
                beforeEach(function() {
                    subject.Y = 0xF1;
                    operand = subject.read(subject.PC);
                });
                
                it("returns the operand(word)", function() {
                    expect(subject.absY(operand)).to.equal(0x3221); });
            });
            
            describe("#ind(operand)", function() {
                beforeEach(function() {
                    subject.PC = 0x8004;
                    operand = subject.read(subject.PC);
                });
                
                it("returns the reading(word) of the operand(word)", function() {
                    expect(subject.ind(operand)).to.equal(0x3130); });
            });
            describe("#indX(operand)", function() {
                beforeEach(function() { subject.X = 0x01; });
                
                it("returns the reading of (the operand + X)", function() {
                    expect(subject.indX(0x00)).to.equal(0x1211); });
            });
            describe("#indY(operand)", function() {
                beforeEach(function() { subject.Y = 0x12; });
                
                it("returns (the reading of the operand) + Y", function() {
                    expect(subject.indY(0x00)).to.equal(0x1122); });
            });
        });
        
        describe("#cSignedByte(value)", function() {
            it("keeps negative numbers negative", function() {
                var number=-1;
                expect(subject.cSignedByte(number)).to.equal(number);
            });
            it("keeps 0x00-0x7F positive", function() {
                [0x00, 0x01, 0x7F].forEach(function(number) {
                    expect(subject.cSignedByte(number)).to.equal(number);
                });
            });
            it("turns 0x80-0xFF negative", function() {
                expect(subject.cSignedByte(0x80)).to.equal(-128);
                expect(subject.cSignedByte(0xFF)).to.equal(-1);
            });
        });
        
        //-------------------------------------------------------------------------------//
        
        context("Instructions", function() {
            beforeEach(function() {
                subject.P  = 0x30; //This is kinda the 'null' P, as bit 4 and 5 are always set...
                subject.PC = 0x0000;
            });
            
            describe("#BRK()",         function() {
                beforeEach(function() {
                    subject.ram = [0x00, 0x00];
                    subject.doInstruction();
                });
                
                it("pushes P to the stack with B flag set", function() {
                    var pushedP = subject.pullByte();
                    expect(pushedP).to.equal(subject.P);
                    expect(pushedP&0x10).to.be.truthy;
                });
                it("pushes PC of the next opcode to the stack", function() {
                    subject.pullByte(); //Pull P first...
                    expect(subject.pullWord()).to.equal(0x0001); });
                it("sets PC to the address at 0xFFFE", function() {
                    expect(subject.PC).to.equal(0x9ABC); });
                it("takes 7 cycles", function() { expect(subject.tick).to.equal(7); });
            });
            describe("#RTI()",         function() {
                beforeEach(function() {
                    subject.ram = [0x40, 0x00];
                    subject.pushWord(0x1234);
                    subject.pushByte(0x56);
                    subject.doInstruction();
                });
                it("pulls P from stack", function() {
                    expect(subject.P).to.equal(0x56); });
                it("pulls PC from stack", function() {
                    expect(subject.PC).to.equal(0x1234); });
                it("takes 6 cycles", function() { expect(subject.tick).to.equal(6); });
            });
            describe("#JSR(absolute)", function() {
                beforeEach(function() {
                    subject.ram = [0x20, 0x34, 0x12];
                    subject.doInstruction();
                });
                it("pushes PC (before the second byte of operand) to the stack", function() {
                    expect(subject.pullWord()).to.equal(0x0001); });
                it("sets PC to the operand", function() {
                    expect(subject.PC).to.equal(0x1234); });
                it("takes 6 cycles", function() { expect(subject.tick).to.equal(6); });
            });
            describe("#RTS()",         function() {
                beforeEach(function() {
                    subject.ram = [0x60, 0x00];
                    subject.pushWord(0x1234);
                    subject.doInstruction();
                });
                it("pulls PC from stack (and increments it once)", function() {
                    expect(subject.PC).to.equal(0x1235); });
                it("takes 6 cycles", function() { expect(subject.tick).to.equal(6); });
            });
            describe("#JMP(absolute)", function() {
                beforeEach(function() {
                    subject.ram = [0x4C, 0x34, 0x12];
                    subject.doInstruction();
                });
                it("sets PC to the operand", function() {
                    expect(subject.PC).to.equal(0x1234); });
                it("takes 3 cycles", function() { expect(subject.tick).to.equal(3); });
            });
            describe("#JMP(indirect)", function() {
                beforeEach(function() {
                    subject.ram = [0x6C, 0x03, 0x00, 0x78, 0x56];
                    subject.doInstruction();
                });
                it("sets PC to the address given by the operand", function() {
                    expect(subject.PC).to.equal(0x5678); });
                it("takes 5 cycles", function() { expect(subject.tick).to.equal(5); });
            });
            
            describe("#BPL(relative)", function() {
                beforeEach(function() {
                    subject.ram = [0x10, 0x10];
                });
                context("if positive", function() {
                    beforeEach(function() {
                        subject.setNegative(false);
                        subject.doInstruction();
                    });
                    it("branches", function() {
                        expect(subject.PC).to.equal(0x0012); });
                    it("takes 3 cycles", function() {
                        expect(subject.tick).to.equal(3); });
                });
                context("if not positive", function() {
                    beforeEach(function() {
                        subject.setNegative(true);
                        subject.doInstruction();
                    });
                    it("continues to next opcode", function() {
                        expect(subject.PC).to.equal(0x0002); });
                    it("takes 2 cycles", function() { expect(subject.tick).to.equal(2); });
                });
            });
            describe("#BMI(relative)", function() {
                beforeEach(function() {
                    subject.ram = [0x30, 0x10];
                });
                context("if negative", function() {
                    beforeEach(function() {
                        subject.setNegative(true);
                        subject.doInstruction();
                    });
                    it("branches", function() {
                        expect(subject.PC).to.equal(0x0012); });
                    it("takes 3 cycles", function() {
                        expect(subject.tick).to.equal(3); });
                });
                context("if not negative", function() {
                    beforeEach(function() {
                        subject.setNegative(false);
                        subject.doInstruction();
                    });
                    it("continues to next opcode", function() {
                        expect(subject.PC).to.equal(0x0002); });
                    it("takes 2 cycles", function() {
                        expect(subject.tick).to.equal(2); });
                });
            });
            describe("#BVC(relative)", function() {
                beforeEach(function() {
                    subject.ram = [0x50, 0x10];
                });
                context("if oVerflow clear", function() {
                    beforeEach(function() {
                        subject.clrOverflow();
                        subject.doInstruction();
                    });
                    it("branches", function() {
                        expect(subject.PC).to.equal(0x0012); });
                    it("takes 3 cycles", function() {
                        expect(subject.tick).to.equal(3); });
                });
                context("if oVerflow not clear", function() {
                    beforeEach(function() {
                        subject.setOverflow(true);
                        subject.doInstruction();
                    });
                    it("continues to next opcode", function() {
                        expect(subject.PC).to.equal(0x0002); });
                    it("takes 2 cycles", function() {
                        expect(subject.tick).to.equal(2); });
                });
            });
            describe("#BVS(relative)", function() {
                beforeEach(function() {
                    subject.ram = [0x70, 0x10];
                });
                context("if oVerflow set", function() {
                    beforeEach(function() {
                        subject.setOverflow(true);
                        subject.doInstruction();
                    });
                    it("branches", function() {
                        expect(subject.PC).to.equal(0x0012); });
                    it("takes 3 cycles", function() {
                        expect(subject.tick).to.equal(3); });
                });
                context("if oVerflow not set", function() {
                    beforeEach(function() {
                        subject.setOverflow(false);
                        subject.doInstruction();
                    });
                    it("continues to next opcode", function() {
                        expect(subject.PC).to.equal(0x0002); });
                    it("takes 2 cycles", function() {
                        expect(subject.tick).to.equal(2); });
                });
            });
            describe("#BCC(relative)", function() {
                beforeEach(function() {
                    subject.ram = [0x90, 0x10];
                });
                context("if Carry clear", function() {
                    beforeEach(function() {
                        subject.clrCarry();
                        subject.doInstruction();
                    });
                    it("branches", function() {
                        expect(subject.PC).to.equal(0x0012); });
                    it("takes 3 cycles", function() {
                        expect(subject.tick).to.equal(3); });
                });
                context("if Carry not clear", function() {
                    beforeEach(function() {
                        subject.setCarry(true);
                        subject.doInstruction();
                    });
                    it("continues to next opcode", function() {
                        expect(subject.PC).to.equal(0x0002); });
                    it("takes 2 cycles", function() {
                        expect(subject.tick).to.equal(2); });
                });
            });
            describe("#BCS(relative)", function() {
                beforeEach(function() {
                    subject.ram = [0xB0, 0x10];
                });
                context("if Carry set", function() {
                    beforeEach(function() {
                        subject.setCarry(true);
                        subject.doInstruction();
                    });
                    it("branches", function() {
                        expect(subject.PC).to.equal(0x0012); });
                    it("takes 3 cycles", function() {
                        expect(subject.tick).to.equal(3); });
                });
                context("if Carry not set", function() {
                    beforeEach(function() {
                        subject.setCarry(false);
                        subject.doInstruction();
                    });
                    it("continues to next opcode", function() {
                        expect(subject.PC).to.equal(0x0002); });
                    it("takes 2 cycles", function() {
                        expect(subject.tick).to.equal(2); });
                });
            });
            describe("#BNE(relative)", function() {
                beforeEach(function() {
                    subject.ram = [0xD0, 0x10];
                });
                context("if not equal (Z flag clear)", function() {
                    beforeEach(function() {
                        subject.clrZero();
                        subject.doInstruction();
                    });
                    it("branches", function() {
                        expect(subject.PC).to.equal(0x0012); });
                    it("takes 3 cycles", function() {
                        expect(subject.tick).to.equal(3); });
                });
                context("if equal (Z flag set)", function() {
                    beforeEach(function() {
                        subject.setZero(true);
                        subject.doInstruction();
                    });
                    it("continues to next opcode", function() {
                        expect(subject.PC).to.equal(0x0002); });
                    it("takes 2 cycles", function() {
                        expect(subject.tick).to.equal(2); });
                });
            });
            describe("#BEQ(relative)", function() {
                beforeEach(function() {
                    subject.ram = [0xF0, 0x10];
                });
                context("if equal (Z flag set)", function() {
                    beforeEach(function() {
                        subject.setZero(true);
                        subject.doInstruction();
                    });
                    it("branches", function() {
                        expect(subject.PC).to.equal(0x0012); });
                    it("takes 3 cycles", function() {
                        expect(subject.tick).to.equal(3); });
                });
                context("if not equal (Z flag clear)", function() {
                    beforeEach(function() {
                        subject.clrZero();
                        subject.doInstruction();
                    });
                    it("continues to next opcode", function() {
                        expect(subject.PC).to.equal(0x0002); });
                    it("takes 2 cycles", function() {
                        expect(subject.tick).to.equal(2); });
                });
            });
            
            describe("#PHA()", function() {
                beforeEach(function() {
                    subject.ram = [0x48, 0x00];
                    subject.A = 0x0A;
                    subject.doInstruction();
                });
                it("pushes A to the stack", function() {
                    expect(subject.pullByte()).to.equal(0x0A); });
                it("sets PC to the next opcode", function() {
                    expect(subject.PC).to.equal(0x0001); });
                it("takes 3 cycles", function() { expect(subject.tick).to.equal(3); });
            });
            describe("#PHP()", function() {
                beforeEach(function() {
                    subject.ram = [0x08, 0x00];
                    subject.P = 0x05;
                    subject.doInstruction();
                });
                it("pushes P to the stack", function() {
                    expect(subject.pullByte()).to.equal(0x05); });
                it("sets PC to the next opcode", function() {
                    expect(subject.PC).to.equal(0x0001); });
                it("takes 3 cycles", function() { expect(subject.tick).to.equal(3); });
            });
            describe("#PLA()", function() {
                beforeEach(function() {
                    subject.ram = [0x68, 0x00];
                });
                it("pulls A from the stack", function() {
                    subject.pushByte(0xAA);
                    subject.doInstruction();
                    expect(subject.A).to.equal(0xAA); });
                it("sets Z flag if zero", function() {
                    subject.pushByte(0x00);
                    subject.doInstruction();
                    expect(subject.P & 0x02).to.be.truthy; });
                it("sets N flag if negative", function() {
                    subject.pushByte(-1);
                    subject.doInstruction();
                    expect(subject.P & 0x80).to.be.truthy; });
                it("sets PC to the next opcode", function() {
                    subject.doInstruction();
                    expect(subject.PC).to.equal(0x0001); });
                it("takes 4 cycles", function() {
                    subject.doInstruction();
                    expect(subject.tick).to.equal(4); });
            });
            describe("#PLP()", function() {
                beforeEach(function() {
                    subject.ram = [0x28, 0x00];
                    subject.pushByte(0x55);
                    subject.doInstruction();
                });
                it("pulls P from the stack", function() {
                    expect(subject.P).to.equal(0x55); });
                it("sets PC to the next opcode", function() {
                    expect(subject.PC).to.equal(0x0001); });
                it("takes 4 cycles", function() { expect(subject.tick).to.equal(4); });
            });
            
            describe("#CLC()", function() {
                beforeEach(function() {
                    subject.P = 0xFF;
                    subject.ram = [0x18, 0x00];
                    subject.doInstruction();
                });
                it("clears Carry flag", function() {
                    expect(subject.P & 0x01).to.be.falsy; });
                it("sets PC to the next opcode", function() {
                    expect(subject.PC).to.equal(0x0001); });
                it("takes 2 cycles", function() { expect(subject.tick).to.equal(2); });
            });
            describe("#CLD()", function() {
                beforeEach(function() {
                    subject.P = 0xFF;
                    subject.ram = [0xD8, 0x00];
                    subject.doInstruction();
                });
                it("clears Decimal flag", function() {
                    expect(subject.P & 0x08).to.be.falsy; });
                it("sets PC to the next opcode", function() {
                    expect(subject.PC).to.equal(0x0001); });
                it("takes 2 cycles", function() { expect(subject.tick).to.equal(2); });
            });
            describe("#CLI()", function() {
                beforeEach(function() {
                    subject.P = 0xFF;
                    subject.ram = [0x58, 0x00];
                    subject.doInstruction();
                });
                it("clears Interrupt Disable flag", function() {
                    expect(subject.P & 0x04).to.be.falsy; });
                it("sets PC to the next opcode", function() {
                    expect(subject.PC).to.equal(0x0001); });
                it("takes 2 cycles", function() { expect(subject.tick).to.equal(2); });
            });
            describe("#CLV()", function() {
                beforeEach(function() {
                    subject.P = 0xFF;
                    subject.ram = [0xB8, 0x00];
                    subject.doInstruction();
                });
                it("clears Overflow flag", function() {
                    expect(subject.P & 0x40).to.be.falsy; });
                it("sets PC to the next opcode", function() {
                    expect(subject.PC).to.equal(0x0001); });
                it("takes 2 cycles", function() { expect(subject.tick).to.equal(2); });
            });
            describe("#SEC()", function() {
                beforeEach(function() {
                    subject.ram = [0x38, 0x00];
                    subject.doInstruction();
                });
                it("sets Carry flag", function() {
                    expect(subject.P & 0x01).to.be.truthy; });
                it("sets PC to the next opcode", function() {
                    expect(subject.PC).to.equal(0x0001); });
                it("takes 2 cycles", function() { expect(subject.tick).to.equal(2); });
            });
            describe("#SED()", function() {
                beforeEach(function() {
                    subject.ram = [0xF8, 0x00];
                    subject.doInstruction();
                });
                it("sets Decimal flag", function() {
                    expect(subject.P & 0x08).to.be.truthy; });
                it("sets PC to the next opcode", function() {
                    expect(subject.PC).to.equal(0x0001); });
                it("takes 2 cycles", function() { expect(subject.tick).to.equal(2); });
            });
            describe("#SEI()", function() {
                beforeEach(function() {
                    subject.ram = [0x78, 0x00];
                    subject.doInstruction();
                });
                it("sets Interrupt Disable flag", function() {
                    expect(subject.P & 0x04).to.be.truthy; });
                it("sets PC to the next opcode", function() {
                    expect(subject.PC).to.equal(0x0001); });
                it("takes 2 cycles", function() { expect(subject.tick).to.equal(2); });
            });
            
            describe("#TAX()", function() {
                beforeEach(function() {
                    subject.ram = [0xAA, 0x00];
                });
                it("transfers A to X", function() {
                    subject.A = 0x0A;
                    subject.doInstruction();
                    expect(subject.X).to.equal(0x0A); });
                it("sets Z flag if zero", function() {
                    subject.A = 0x00;
                    subject.doInstruction();
                    expect(subject.P & 0x02).to.be.truthy; });
                it("sets N flag if negative", function() {
                    subject.A = -1;
                    subject.doInstruction();
                    expect(subject.P & 0x80).to.be.truthy; });
                it("sets PC to the next opcode", function() {
                    subject.doInstruction();
                    expect(subject.PC).to.equal(0x0001); });
                it("takes 2 cycles", function() {
                    subject.doInstruction();
                    expect(subject.tick).to.equal(2); });
            });
            describe("#TXA()", function() {
                beforeEach(function() {
                    subject.ram = [0x8A, 0x00];
                });
                it("transfers X to A", function() {
                    subject.X = 0x0B;
                    subject.doInstruction();
                    expect(subject.A).to.equal(0x0B); });
                it("sets Z flag if zero", function() {
                    subject.X = 0x00;
                    subject.doInstruction();
                    expect(subject.P & 0x02).to.be.truthy; });
                it("sets N flag if negative", function() {
                    subject.X = -1;
                    subject.doInstruction();
                    expect(subject.P & 0x80).to.be.truthy; });
                it("sets PC to the next opcode", function() {
                    subject.doInstruction();
                    expect(subject.PC).to.equal(0x0001); });
                it("takes 2 cycles", function() {
                    subject.doInstruction();
                    expect(subject.tick).to.equal(2); });
            });
            describe("#TAY()", function() {
                beforeEach(function() {
                    subject.ram = [0xA8, 0x00];
                });
                it("transfers A to Y", function() {
                    subject.A = 0x0A;
                    subject.doInstruction();
                    expect(subject.Y).to.equal(0x0A); });
                it("sets Z flag if zero", function() {
                    subject.A = 0x00;
                    subject.doInstruction();
                    expect(subject.P & 0x02).to.be.truthy; });
                it("sets N flag if negative", function() {
                    subject.A = -1;
                    subject.doInstruction();
                    expect(subject.P & 0x80).to.be.truthy; });
                it("sets PC to the next opcode", function() {
                    subject.doInstruction();
                    expect(subject.PC).to.equal(0x0001); });
                it("takes 2 cycles", function() {
                    subject.doInstruction();
                    expect(subject.tick).to.equal(2); });
            });
            describe("#TYA()", function() {
                beforeEach(function() {
                    subject.ram = [0x98, 0x00];
                });
                it("transfers Y to A", function() {
                    subject.Y = 0x0C;
                    subject.doInstruction();
                    expect(subject.A).to.equal(0x0C); });
                it("sets Z flag if zero", function() {
                    subject.Y = 0x00;
                    subject.doInstruction();
                    expect(subject.P & 0x02).to.be.truthy; });
                it("sets N flag if negative", function() {
                    subject.Y = -1;
                    subject.doInstruction();
                    expect(subject.P & 0x80).to.be.truthy; });
                it("sets PC to the next opcode", function() {
                    subject.doInstruction();
                    expect(subject.PC).to.equal(0x0001); });
                it("takes 2 cycles", function() {
                    subject.doInstruction();
                    expect(subject.tick).to.equal(2); });
            });
            describe("#TSX()", function() {
                beforeEach(function() {
                    subject.ram = [0xBA, 0x00];
                });
                it("transfers Stack Pointer to X", function() {
                    subject.SP = 0x0D;
                    subject.doInstruction();
                    expect(subject.X).to.equal(0x0D); });
                it("sets Z flag if zero", function() {
                    subject.SP = 0x00;
                    subject.doInstruction();
                    expect(subject.P & 0x02).to.be.truthy; });
                it("sets N flag if bit 7 is set", function() {
                    subject.SP = 0xFF;
                    subject.doInstruction();
                    expect(subject.P & 0x80).to.be.truthy; });
                it("sets PC to the next opcode", function() {
                    subject.doInstruction();
                    expect(subject.PC).to.equal(0x0001); });
                it("takes 2 cycles", function() {
                    subject.doInstruction();
                    expect(subject.tick).to.equal(2); });
            });
            describe("#TXS()", function() {
                beforeEach(function() {
                    subject.ram = [0x9A, 0x00];
                });
                it("transfers X to Stack Pointer", function() {
                    subject.X = 0x0E;
                    subject.doInstruction();
                    expect(subject.SP).to.equal(0x0E); });
                it("does not set Z flag", function() {
                    subject.X = 0x00;
                    subject.doInstruction();
                    expect(subject.P & 0x02).not.to.be.truthy; });
                it("does not set N flag", function() {
                    subject.X = 0xFF;
                    subject.doInstruction();
                    expect(subject.P & 0x80).not.to.be.truthy; });
                it("sets PC to the next opcode", function() {
                    subject.doInstruction();
                    expect(subject.PC).to.equal(0x0001); });
                it("takes 2 cycles", function() {
                    subject.doInstruction();
                    expect(subject.tick).to.equal(2); });
            });
            
            //All the addressing modes are tested here with #LDA, #LDX and #LDY
            describe("#LDA(immediate)", function() {
                beforeEach(function() {
                    subject.ram = [0xA9, 0x0A];
                });
                it("loads a byte into A", function() {
                    subject.doInstruction();
                    expect(subject.A).to.equal(0x0A); });
                it("sets Z flag if zero", function() {
                    subject.ram[1] = 0x00;
                    subject.doInstruction();
                    expect(subject.P & 0x02).to.be.truthy; });
                it("sets N flag if bit 7 is set", function() {
                    subject.ram[1] = 0x80;
                    subject.doInstruction();
                    expect(subject.P & 0x80).to.be.truthy; });
                it("sets PC to the next opcode", function() {
                    subject.doInstruction();
                    expect(subject.PC).to.equal(0x0002); });
                it("takes 2 cycles", function() {
                    subject.doInstruction();
                    expect(subject.tick).to.equal(2); });
            });
            describe("#LDA(zero)",      function() {
                beforeEach(function() {
                    subject.ram = [0xA5, 0x02, 0x0A];
                });
                it("loads the addressed byte into A", function() {
                    subject.doInstruction();
                    expect(subject.A).to.equal(0x0A); });
                it("sets PC to the next opcode", function() {
                    subject.doInstruction();
                    expect(subject.PC).to.equal(0x0002); });
                it("takes 3 cycles", function() {
                    subject.doInstruction();
                    expect(subject.tick).to.equal(3); });
            });
            describe("#LDA(absolute)",  function() {
                beforeEach(function() {
                    subject.ram = [0xAD, 0x03, 0x00, 0x0A];
                });
                it("loads the addressed byte into A", function() {
                    subject.doInstruction();
                    expect(subject.A).to.equal(0x0A); });
                it("sets PC to the next opcode", function() {
                    subject.doInstruction();
                    expect(subject.PC).to.equal(0x0003); });
                it("takes 4 cycles", function() {
                    subject.doInstruction();
                    expect(subject.tick).to.equal(4); });
            });
            describe("#LDA(indirectX)", function() {
                beforeEach(function() {
                    subject.X = 0x01;
                    subject.ram = [0xA1, 0x02, 0x00, 0x05, 0x00, 0x0A];
                });
                it("loads the addressed byte into A", function() {
                    subject.doInstruction();
                    expect(subject.A).to.equal(0x0A); });
                it("sets PC to the next opcode", function() {
                    subject.doInstruction();
                    expect(subject.PC).to.equal(0x0002); });
                it("takes 6 cycles", function() {
                    subject.doInstruction();
                    expect(subject.tick).to.equal(6); });
            });
            describe("#LDA(indirectY)", function() {
                beforeEach(function() {
                    subject.Y = 0x01;
                    subject.ram = [0xB1, 0x03, 0x00, 0x04, 0x00, 0x0A];
                });
                it("loads the addressed byte into A", function() {
                    subject.doInstruction();
                    expect(subject.A).to.equal(0x0A); });
                it("sets PC to the next opcode", function() {
                    subject.doInstruction();
                    expect(subject.PC).to.equal(0x0002); });
                it("takes 5 cycles", function() {
                    subject.doInstruction();
                    expect(subject.tick).to.equal(5); });
                it("takes 6 cycles if page crossed", function() {
                    subject.Y = 0xFF;
                    subject.doInstruction();
                    expect(subject.tick).to.equal(6); });
            });
            describe("#LDX(immediate)", function() {
                beforeEach(function() {
                    subject.ram = [0xA2, 0x0B];
                });
                it("loads a byte into X", function() {
                    subject.doInstruction();
                    expect(subject.X).to.equal(0x0B); });
                it("sets Z flag if zero", function() {
                    subject.ram[1] = 0x00;
                    subject.doInstruction();
                    expect(subject.P & 0x02).to.be.truthy; });
                it("sets N flag if bit 7 is set", function() {
                    subject.ram[1] = 0x80;
                    subject.doInstruction();
                    expect(subject.P & 0x80).to.be.truthy; });
                it("sets PC to the next opcode", function() {
                    subject.doInstruction();
                    expect(subject.PC).to.equal(0x0002); });
                it("takes 2 cycles", function() {
                    subject.doInstruction();
                    expect(subject.tick).to.equal(2); });
            });
            describe("#LDX(zeroY)",     function() {
                beforeEach(function() {
                    subject.Y = 0x01;
                    subject.ram = [0xB6, 0x02, 0x00, 0x0B];
                });
                it("loads the addressed byte into X", function() {
                    subject.doInstruction();
                    expect(subject.X).to.equal(0x0B); });
                it("sets PC to the next opcode", function() {
                    subject.doInstruction();
                    expect(subject.PC).to.equal(0x0002); });
                it("takes 4 cycles", function() {
                    subject.doInstruction();
                    expect(subject.tick).to.equal(4); });
            });
            describe("#LDX(absoluteY)", function() {
                beforeEach(function() {
                    subject.Y = 0x01;
                    subject.ram = [0xBE, 0x03, 0x00, 0x00, 0x0B];
                });
                it("loads the addressed byte into X", function() {
                    subject.doInstruction();
                    expect(subject.X).to.equal(0x0B); });
                it("sets PC to the next opcode", function() {
                    subject.doInstruction();
                    expect(subject.PC).to.equal(0x0003); });
                it("takes 4 cycles", function() {
                    subject.doInstruction();
                    expect(subject.tick).to.equal(4); });
                it("takes 5 cycles if page crossed", function() {
                    subject.Y = 0xFF;
                    subject.doInstruction();
                    expect(subject.tick).to.equal(5); });
            });
            describe("#LDY(immediate)", function() {
                beforeEach(function() {
                    subject.ram = [0xA0, 0x0C];
                });
                it("loads a byte into Y", function() {
                    subject.doInstruction();
                    expect(subject.Y).to.equal(0x0C); });
                it("sets Z flag if zero", function() {
                    subject.ram[1] = 0x00;
                    subject.doInstruction();
                    expect(subject.P & 0x02).to.be.truthy; });
                it("sets N flag if bit 7 is set", function() {
                    subject.ram[1] = 0x80;
                    subject.doInstruction();
                    expect(subject.P & 0x80).to.be.truthy; });
                it("sets PC to the next opcode", function() {
                    subject.doInstruction();
                    expect(subject.PC).to.equal(0x0002); });
                it("takes 2 cycles", function() {
                    subject.doInstruction();
                    expect(subject.tick).to.equal(2); });
            });
            describe("#LDY(zeroX)",     function() {
                beforeEach(function() {
                    subject.X = 0x01;
                    subject.ram = [0xB4, 0x02, 0x00, 0x0C];
                });
                it("loads the addressed byte into Y", function() {
                    subject.doInstruction();
                    expect(subject.Y).to.equal(0x0C); });
                it("sets PC to the next opcode", function() {
                    subject.doInstruction();
                    expect(subject.PC).to.equal(0x0002); });
                it("takes 4 cycles", function() {
                    subject.doInstruction();
                    expect(subject.tick).to.equal(4); });
            });
            describe("#LDY(absoluteX)", function() {
                beforeEach(function() {
                    subject.X = 0x01;
                    subject.ram = [0xBC, 0x03, 0x00, 0x00, 0x0C];
                });
                it("loads the addressed byte into Y", function() {
                    subject.doInstruction();
                    expect(subject.Y).to.equal(0x0C); });
                it("sets PC to the next opcode", function() {
                    subject.doInstruction();
                    expect(subject.PC).to.equal(0x0003); });
                it("takes 4 cycles", function() {
                    subject.doInstruction();
                    expect(subject.tick).to.equal(4); });
                it("takes 5 cycles if page crossed", function() {
                    subject.X = 0xFF;
                    subject.doInstruction();
                    expect(subject.tick).to.equal(5); });
            });
            
            describe("#ADC(immediate)", function() {
                beforeEach(function() {
                    subject.A = 0x10;
                    subject.ram = [0x69, 0x08];
                });
                it("adds a byte to A", function() {
                    subject.doInstruction();
                    expect(subject.A).to.equal(0x18); });
                it("adds the Carry bit if set", function() {
                    subject.setCarry(true);
                    subject.doInstruction();
                    expect(subject.A).to.equal(0x19); });
                it("sets Zero flag if result is zero", function() {
                    subject.A = 0xF8;
                    subject.doInstruction();
                    expect(subject.P & 0x02).to.be.truthy; });
                it("sets Negative flag if bit 7 is set", function() {
                    subject.ram[1] = 0x70;
                    subject.doInstruction();
                    expect(subject.P & 0x80).to.be.truthy; });
                it("sets PC to the next opcode", function() {
                    subject.doInstruction();
                    expect(subject.PC).to.equal(0x0002); });
                it("takes 2 cycles", function() {
                    subject.doInstruction();
                    expect(subject.tick).to.equal(2); });
                
                //http://www.righto.com/2012/12/the-6502-overflow-flag-explained.html
                context("64 + 16 = 80", function() {
                    beforeEach(function() {
                        subject.A      = 0x40;
                        subject.ram[1] = 0x10;
                        subject.doInstruction();
                    });
                    it("sets A to 0x50",       function() { expect(subject.A).to.equal(0x50); });
                    it("clears Carry flag",    function() { expect(subject.P & 0x01).to.be.falsy });
                    it("clears oVerflow flag", function() { expect(subject.P & 0x40).to.be.falsy });
                });
                context("64 + 80 = 144", function() {
                    beforeEach(function() {
                        subject.A      = 0x40;
                        subject.ram[1] = 0x50;
                        subject.doInstruction();
                    });
                    it("sets A to 0x90",       function() { expect(subject.A).to.equal(0x90); });
                    it("clears Carry flag",    function() { expect(subject.P & 0x01).to.be.falsy });
                    it("sets oVerflow flag",   function() { expect(subject.P & 0x40).to.be.truthy });
                });
                context("64 + -16 = 48", function() {
                    beforeEach(function() {
                        subject.A      = 0x40;
                        subject.ram[1] = 0xF0;
                        subject.doInstruction();
                    });
                    it("sets A to 0x30",       function() { expect(subject.A).to.equal(0x30); });
                    it("sets Carry flag",      function() { expect(subject.P & 0x01).to.be.truthy });
                    it("clears oVerflow flag", function() { expect(subject.P & 0x40).to.be.falsy });
                });
                context("64 + -80 = -16", function() {
                    beforeEach(function() {
                        subject.A      = 0x40;
                        subject.ram[1] = 0xB0;
                        subject.doInstruction();
                    });
                    it("sets A to 0xF0",       function() { expect(subject.A).to.equal(0xF0); });
                    it("clears Carry flag",    function() { expect(subject.P & 0x01).to.be.falsy });
                    it("clears oVerflow flag", function() { expect(subject.P & 0x40).to.be.falsy });
                });
                context("-48 + 16 = -32", function() {
                    beforeEach(function() {
                        subject.A      = 0xD0;
                        subject.ram[1] = 0x10;
                        subject.doInstruction();
                    });
                    it("sets A to 0xE0",       function() { expect(subject.A).to.equal(0xE0); });
                    it("clears Carry flag",    function() { expect(subject.P & 0x01).to.be.falsy });
                    it("clears oVerflow flag", function() { expect(subject.P & 0x40).to.be.falsy });
                });
                context("-48 + 80 = 32", function() {
                    beforeEach(function() {
                        subject.A      = 0xD0;
                        subject.ram[1] = 0x50;
                        subject.doInstruction();
                    });
                    it("sets A to 0x20",       function() { expect(subject.A).to.equal(0x20); });
                    it("sets Carry flag",      function() { expect(subject.P & 0x01).to.be.truthy });
                    it("clears oVerflow flag", function() { expect(subject.P & 0x40).to.be.falsy });
                });
                context("-48 + -16 = -64", function() {
                    beforeEach(function() {
                        subject.A      = 0xD0;
                        subject.ram[1] = 0xF0;
                        subject.doInstruction();
                    });
                    it("sets A to 0xC0",       function() { expect(subject.A).to.equal(0xC0); });
                    it("sets Carry flag",      function() { expect(subject.P & 0x01).to.be.truthy });
                    it("clears oVerflow flag", function() { expect(subject.P & 0x40).to.be.falsy });
                });
                context("-48 + -80 = -128", function() {
                    beforeEach(function() {
                        subject.A      = 0xD0;
                        subject.ram[1] = 0xB0;
                        subject.doInstruction();
                    });
                    it("sets A to 0x80",       function() { expect(subject.A).to.equal(0x80); });
                    it("sets Carry flag",      function() { expect(subject.P & 0x01).to.be.truthy });
                    it("clears oVerflow flag", function() { expect(subject.P & 0x40).to.be.falsy });
                });
                context("-48 + -112 = [-> +96 <-]", function() {
                    beforeEach(function() {
                        subject.A      = 0xD0;
                        subject.ram[1] = 0x90;
                        subject.doInstruction();
                    });
                    it("sets A to 0x60",       function() { expect(subject.A).to.equal(0x60); });
                    it("sets Carry flag",      function() { expect(subject.P & 0x01).to.be.truthy });
                    it("sets oVerflow flag",   function() { expect(subject.P & 0x40).to.be.truthy });
                    it("clears Negative flag", function() { expect(subject.P & 0x80).to.be.falsy });
                });
            });
            describe("#SBC(immediate)", function() {
                beforeEach(function() {
                    subject.A = 0x50;
                    subject.ram = [0xE9, 0x38];
                });
                it("subtracts a byte from A", function() {
                    subject.doInstruction();
                    expect(subject.A).to.equal(0x18); });
                it("subtracts the Carry bit", function() {
                    subject.setCarry(true);
                    subject.doInstruction();
                    expect(subject.A).to.equal(0x17); });
                it("sets Zero flag if result is zero", function() {
                    subject.A = 0x38;
                    subject.doInstruction();
                    expect(subject.P & 0x02).to.be.truthy; });
                it("sets Negative flag if bit 7 is set", function() {
                    subject.ram[1] = 0x70;
                    subject.doInstruction();
                    expect(subject.P & 0x80).to.be.truthy; });
                it("sets PC to the next opcode", function() {
                    subject.doInstruction();
                    expect(subject.PC).to.equal(0x0002); });
                it("takes 2 cycles", function() {
                    subject.doInstruction();
                    expect(subject.tick).to.equal(2); });
                
                //http://www.righto.com/2012/12/the-6502-overflow-flag-explained.html
                context("64 - -16 = 80", function() {
                    beforeEach(function() {
                        subject.A      = 0x40;
                        subject.ram[1] = 0xF0;
                        subject.doInstruction();
                    });
                    it("sets A to 0x50",       function() { expect(subject.A).to.equal(0x50); });
                    it("clears Carry flag",    function() { expect(subject.P & 0x01).to.be.falsy });
                    it("clears oVerflow flag", function() { expect(subject.P & 0x40).to.be.falsy });
                });
                context("64 - -80 = [-> -144 <-]", function() {
                    beforeEach(function() {
                        subject.A      = 0x40;
                        subject.ram[1] = 0xB0;
                        subject.doInstruction();
                    });
                    it("sets A to 0x90",       function() { expect(subject.A).to.equal(0x90); });
                    it("clears Carry flag",    function() { expect(subject.P & 0x01).to.be.falsy });
                    it("sets oVerflow flag",   function() { expect(subject.P & 0x40).to.be.truthy });
                });
                context("64 - 48 = 16", function() {
                    beforeEach(function() {
                        subject.A      = 0x40;
                        subject.ram[1] = 0x30;
                        subject.doInstruction();
                    });
                    it("sets A to 0x10",       function() { expect(subject.A).to.equal(0x10); });
                    it("sets Carry flag",      function() { expect(subject.P & 0x01).to.be.truthy });
                    it("clears oVerflow flag", function() { expect(subject.P & 0x40).to.be.falsy });
                });
                context("64 - 112 = -48", function() {
                    beforeEach(function() {
                        subject.A      = 0x40;
                        subject.ram[1] = 0x70;
                        subject.doInstruction();
                    });
                    it("sets A to 0xD0",       function() { expect(subject.A).to.equal(0xD0); });
                    it("clears Carry flag",    function() { expect(subject.P & 0x01).to.be.falsy });
                    it("clears oVerflow flag", function() { expect(subject.P & 0x40).to.be.falsy });
                });
                context("-48 - -16 = -32", function() {
                    beforeEach(function() {
                        subject.A      = 0xD0;
                        subject.ram[1] = 0xF0;
                        subject.doInstruction();
                    });
                    it("sets A to 0xE0",       function() { expect(subject.A).to.equal(0xE0); });
                    it("clears Carry flag",    function() { expect(subject.P & 0x01).to.be.falsy });
                    it("clears oVerflow flag", function() { expect(subject.P & 0x40).to.be.falsy });
                });
                context("-48 - -80 = 32", function() {
                    beforeEach(function() {
                        subject.A      = 0xD0;
                        subject.ram[1] = 0xB0;
                        subject.doInstruction();
                    });
                    it("sets A to 0x20",       function() { expect(subject.A).to.equal(0x20); });
                    it("sets Carry flag",      function() { expect(subject.P & 0x01).to.be.truthy });
                    it("clears oVerflow flag", function() { expect(subject.P & 0x40).to.be.falsy });
                });
                context("-48 - 112 = [-> +96 <-]", function() {
                    beforeEach(function() {
                        subject.A      = 0xD0;
                        subject.ram[1] = 0x70;
                        subject.doInstruction();
                    });
                    it("sets A to 0x60",       function() { expect(subject.A).to.equal(0x60); });
                    it("sets Carry flag",      function() { expect(subject.P & 0x01).to.be.truthy });
                    it("sets oVerflow flag",   function() { expect(subject.P & 0x40).to.be.truthy });
                });
                context("-48 - 48 = -96", function() {
                    beforeEach(function() {
                        subject.A      = 0xD0;
                        subject.ram[1] = 0x30;
                        subject.doInstruction();
                    });
                    it("sets A to 0xA0",       function() { expect(subject.A).to.equal(0xA0); });
                    it("sets Carry flag",      function() { expect(subject.P & 0x01).to.be.truthy });
                    it("clears oVerflow flag", function() { expect(subject.P & 0x40).to.be.falsy });
                });
            });
            
            describe("#ASL()", function() {
                beforeEach(function() {
                    subject.A = 0x55;
                    subject.ram = [0x0A, 0x00];
                });
                it("shifts the bits of A to the left", function() {
                    subject.doInstruction();
                    expect(subject.A).to.equal(0xAA); });
                it("sets C flag when exceeded", function() {
                    subject.A = 0x80;
                    subject.doInstruction();
                    expect(subject.P & 0x01).to.be.truthy; });
                it("sets Z flag if zero", function() {
                    subject.A = 0x00;
                    subject.doInstruction();
                    expect(subject.P & 0x02).to.be.truthy; });
                it("sets N flag if bit 7 is set", function() {
                    subject.A = 0x40;
                    subject.doInstruction();
                    expect(subject.P & 0x80).to.be.truthy; });
                it("sets PC to the next opcode", function() {
                    subject.doInstruction();
                    expect(subject.PC).to.equal(0x0001); });
                it("takes 2 cycles", function() {
                    subject.doInstruction();
                    expect(subject.tick).to.equal(2); });
            });
            describe("#ASL(zero)", function() {
                beforeEach(function() {
                    subject.ram = [0x06, 0x02, 0x55];
                });
                it("shifts the bits of memory location to the left", function() {
                    subject.doInstruction();
                    expect(subject.ram[2]).to.equal(0xAA); });
                it("sets C flag when exceeded", function() {
                    subject.ram[2] = 0x80;
                    subject.doInstruction();
                    expect(subject.P & 0x01).to.be.truthy; });
                it("sets Z flag if zero", function() {
                    subject.ram[2] = 0x00;
                    subject.doInstruction();
                    expect(subject.P & 0x02).to.be.truthy; });
                it("sets N flag if bit 7 is set", function() {
                    subject.ram[2] = 0x40;
                    subject.doInstruction();
                    expect(subject.P & 0x80).to.be.truthy; });
                it("sets PC to the next opcode", function() {
                    subject.doInstruction();
                    expect(subject.PC).to.equal(0x0002); });
                it("takes 5 cycles", function() {
                    subject.doInstruction();
                    expect(subject.tick).to.equal(5); });
            });
            describe("#LSR()", function() {
                beforeEach(function() {
                    subject.A = 0xAA;
                    subject.ram = [0x4A, 0x00];
                });
                it("shifts the bits of A to the right", function() {
                    subject.doInstruction();
                    expect(subject.A).to.equal(0x55); });
                it("sets C flag when exceeded", function() {
                    subject.A = 0x01;
                    subject.doInstruction();
                    expect(subject.P & 0x01).to.be.truthy; });
                it("sets Z flag if zero", function() {
                    subject.A = 0x00;
                    subject.doInstruction();
                    expect(subject.P & 0x02).to.be.truthy; });
                it("sets PC to the next opcode", function() {
                    subject.doInstruction();
                    expect(subject.PC).to.equal(0x0001); });
                it("takes 2 cycles", function() {
                    subject.doInstruction();
                    expect(subject.tick).to.equal(2); });
            });
            describe("#LSR(zero)", function() {
                beforeEach(function() {
                    subject.ram = [0x46, 0x02, 0xAA];
                });
                it("shifts the bits of memory location to the left", function() {
                    subject.doInstruction();
                    expect(subject.ram[2]).to.equal(0x55); });
                it("sets C flag when exceeded", function() {
                    subject.ram[2] = 0x01;
                    subject.doInstruction();
                    expect(subject.P & 0x01).to.be.truthy; });
                it("sets Z flag if zero", function() {
                    subject.ram[2] = 0x00;
                    subject.doInstruction();
                    expect(subject.P & 0x02).to.be.truthy; });
                it("sets PC to the next opcode", function() {
                    subject.doInstruction();
                    expect(subject.PC).to.equal(0x0002); });
                it("takes 5 cycles", function() {
                    subject.doInstruction();
                    expect(subject.tick).to.equal(5); });
            });
            describe("#ROL()", function() {
                beforeEach(function() {
                    subject.A = 0x55;
                    subject.ram = [0x2A, 0x00];
                });
                it("shifts the bits of A to the left", function() {
                    subject.doInstruction();
                    expect(subject.A).to.equal(0xAA); });
                it("fills bit0 with the Carry flag", function() {
                    subject.setCarry(true);
                    subject.doInstruction();
                    expect(subject.A).to.equal(0xAB); });
                it("sets C flag when exceeded", function() {
                    subject.A = 0x80;
                    subject.doInstruction();
                    expect(subject.P & 0x01).to.be.truthy; });
                it("sets Z flag if zero", function() {
                    subject.A = 0x00;
                    subject.doInstruction();
                    expect(subject.P & 0x02).to.be.truthy; });
                it("sets N flag if bit 7 is set", function() {
                    subject.A = 0x40;
                    subject.doInstruction();
                    expect(subject.P & 0x80).to.be.truthy; });
                it("sets PC to the next opcode", function() {
                    subject.doInstruction();
                    expect(subject.PC).to.equal(0x0001); });
                it("takes 2 cycles", function() {
                    subject.doInstruction();
                    expect(subject.tick).to.equal(2); });
            });
            describe("#ROL(zero)", function() {
                beforeEach(function() {
                    subject.ram = [0x26, 0x02, 0x55];
                });
                it("shifts the bits of memory location to the left", function() {
                    subject.doInstruction();
                    expect(subject.ram[2]).to.equal(0xAA); });
                it("fills bit0 with the Carry flag", function() {
                    subject.setCarry(true);
                    subject.doInstruction();
                    expect(subject.ram[2]).to.equal(0xAB); });
                it("sets C flag when exceeded", function() {
                    subject.ram[2] = 0x80;
                    subject.doInstruction();
                    expect(subject.P & 0x01).to.be.truthy; });
                it("sets Z flag if zero", function() {
                    subject.ram[2] = 0x00;
                    subject.doInstruction();
                    expect(subject.P & 0x02).to.be.truthy; });
                it("sets N flag if bit 7 is set", function() {
                    subject.ram[2] = 0x40;
                    subject.doInstruction();
                    expect(subject.P & 0x80).to.be.truthy; });
                it("sets PC to the next opcode", function() {
                    subject.doInstruction();
                    expect(subject.PC).to.equal(0x0002); });
                it("takes 5 cycles", function() {
                    subject.doInstruction();
                    expect(subject.tick).to.equal(5); });
            });
            describe("#ROR()", function() {
                beforeEach(function() {
                    subject.A = 0xAA;
                    subject.ram = [0x6A, 0x00];
                });
                it("shifts the bits of A to the right", function() {
                    subject.doInstruction();
                    expect(subject.A).to.equal(0x55); });
                it("fills bit7 with the Carry flag", function() {
                    subject.setCarry(true);
                    subject.doInstruction();
                    expect(subject.A).to.equal(0xD5); });
                it("sets C flag when exceeded", function() {
                    subject.A = 0x01;
                    subject.doInstruction();
                    expect(subject.P & 0x01).to.be.truthy; });
                it("sets Z flag if zero", function() {
                    subject.A = 0x00;
                    subject.doInstruction();
                    expect(subject.P & 0x02).to.be.truthy; });
                it("sets PC to the next opcode", function() {
                    subject.doInstruction();
                    expect(subject.PC).to.equal(0x0001); });
                it("takes 2 cycles", function() {
                    subject.doInstruction();
                    expect(subject.tick).to.equal(2); });
            });
            describe("#ROR(zero)", function() {
                beforeEach(function() {
                    subject.ram = [0x66, 0x02, 0xAA];
                });
                it("shifts the bits of memory location to the left", function() {
                    subject.doInstruction();
                    expect(subject.ram[2]).to.equal(0x55); });
                it("fills bit7 with the Carry flag", function() {
                    subject.setCarry(true);
                    subject.doInstruction();
                    expect(subject.ram[2]).to.equal(0xD5); });
                it("sets C flag when exceeded", function() {
                    subject.ram[2] = 0x01;
                    subject.doInstruction();
                    expect(subject.P & 0x01).to.be.truthy; });
                it("sets Z flag if zero", function() {
                    subject.ram[2] = 0x00;
                    subject.doInstruction();
                    expect(subject.P & 0x02).to.be.truthy; });
                it("sets PC to the next opcode", function() {
                    subject.doInstruction();
                    expect(subject.PC).to.equal(0x0002); });
                it("takes 5 cycles", function() {
                    subject.doInstruction();
                    expect(subject.tick).to.equal(5); });
            });
            
            describe("#INC(zero)", function() {
                beforeEach(function() {
                    subject.ram = [0xE6, 0x02, 0x0F];
                });
                it("adds one to memory location", function() {
                    subject.doInstruction();
                    expect(subject.ram[2]).to.equal(0x10); });
                it("cannot go higher than 255", function() {
                    subject.ram[2] = 0xFF;
                    subject.doInstruction();
                    expect(subject.ram[2]).to.equal(0x00); });
                it("sets Z flag if zero", function() {
                    subject.ram[2] = -1;
                    subject.doInstruction();
                    expect(subject.P & 0x02).to.be.truthy; });
                it("sets N flag if bit 7 is set", function() {
                    subject.ram[2] = 0x7F;
                    subject.doInstruction();
                    expect(subject.P & 0x80).to.be.truthy; });
                it("sets PC to the next opcode", function() {
                    subject.doInstruction();
                    expect(subject.PC).to.equal(0x0002); });
                it("takes 5 cycles", function() {
                    subject.doInstruction();
                    expect(subject.tick).to.equal(5); });
            });
            describe("#DEC(zero)", function() {
                beforeEach(function() {
                    subject.ram = [0xC6, 0x02, 0x11];
                });
                it("subtracts one from memory location", function() {
                    subject.doInstruction();
                    expect(subject.ram[2]).to.equal(0x10); });
                it("cannot go lower than 0", function() {
                    subject.ram[2] = 0x00;
                    subject.doInstruction();
                    expect(subject.ram[2]).to.equal(0xFF); });
                it("sets Z flag if zero", function() {
                    subject.ram[2] = 1;
                    subject.doInstruction();
                    expect(subject.P & 0x02).to.be.truthy; });
                it("sets N flag if bit 7 is set", function() {
                    subject.ram[2] = 0x81;
                    subject.doInstruction();
                    expect(subject.P & 0x80).to.be.truthy; });
                it("sets PC to the next opcode", function() {
                    subject.doInstruction();
                    expect(subject.PC).to.equal(0x0002); });
                it("takes 5 cycles", function() {
                    subject.doInstruction();
                    expect(subject.tick).to.equal(5); });
            });
            describe("#INX()", function() {
                beforeEach(function() {
                    subject.ram = [0xE8, 0x00];
                });
                it("adds one to X", function() {
                    subject.X = 0x0F;
                    subject.doInstruction();
                    expect(subject.X).to.equal(0x10); });
                it("cannot go higher than 255", function() {
                    subject.X = 0xFF;
                    subject.doInstruction();
                    expect(subject.X).to.equal(0x00); });
                it("sets Z flag if zero", function() {
                    subject.X = -1;
                    subject.doInstruction();
                    expect(subject.P & 0x02).to.be.truthy; });
                it("sets N flag if bit 7 is set", function() {
                    subject.X = 0x7F;
                    subject.doInstruction();
                    expect(subject.P & 0x80).to.be.truthy; });
                it("sets PC to the next opcode", function() {
                    subject.doInstruction();
                    expect(subject.PC).to.equal(0x0001); });
                it("takes 2 cycles", function() {
                    subject.doInstruction();
                    expect(subject.tick).to.equal(2); });
            });
            describe("#DEX()", function() {
                beforeEach(function() {
                    subject.ram = [0xCA, 0x00];
                });
                it("subtracts one from X", function() {
                    subject.X = 0x11;
                    subject.doInstruction();
                    expect(subject.X).to.equal(0x10); });
                it("cannot go lower than 0", function() {
                    subject.X = 0x00;
                    subject.doInstruction();
                    expect(subject.X).to.equal(0xFF); });
                it("sets Z flag if zero", function() {
                    subject.X = 1;
                    subject.doInstruction();
                    expect(subject.P & 0x02).to.be.truthy; });
                it("sets N flag if bit 7 is set", function() {
                    subject.X = 0x81;
                    subject.doInstruction();
                    expect(subject.P & 0x80).to.be.truthy; });
                it("sets PC to the next opcode", function() {
                    subject.doInstruction();
                    expect(subject.PC).to.equal(0x0001); });
                it("takes 2 cycles", function() {
                    subject.doInstruction();
                    expect(subject.tick).to.equal(2); });
            });
            describe("#INY()", function() {
                beforeEach(function() {
                    subject.ram = [0xC8, 0x00];
                });
                it("adds one to Y", function() {
                    subject.Y = 0x0F;
                    subject.doInstruction();
                    expect(subject.Y).to.equal(0x10); });
                it("cannot go higher than 255", function() {
                    subject.Y = 0xFF;
                    subject.doInstruction();
                    expect(subject.Y).to.equal(0x00); });
                it("sets Z flag if zero", function() {
                    subject.Y = -1;
                    subject.doInstruction();
                    expect(subject.P & 0x02).to.be.truthy; });
                it("sets N flag if bit 7 is set", function() {
                    subject.Y = 0x7F;
                    subject.doInstruction();
                    expect(subject.P & 0x80).to.be.truthy; });
                it("sets PC to the next opcode", function() {
                    subject.doInstruction();
                    expect(subject.PC).to.equal(0x0001); });
                it("takes 2 cycles", function() {
                    subject.doInstruction();
                    expect(subject.tick).to.equal(2); });
            });
            describe("#DEY()", function() {
                beforeEach(function() {
                    subject.ram = [0x88, 0x00];
                });
                it("subtracts one from Y", function() {
                    subject.Y = 0x11;
                    subject.doInstruction();
                    expect(subject.Y).to.equal(0x10); });
                it("cannot go lower than 0", function() {
                    subject.Y = 0x00;
                    subject.doInstruction();
                    expect(subject.Y).to.equal(0xFF); });
                it("sets Z flag if zero", function() {
                    subject.Y = 1;
                    subject.doInstruction();
                    expect(subject.P & 0x02).to.be.truthy; });
                it("sets N flag if bit 7 is set", function() {
                    subject.Y = 0x81;
                    subject.doInstruction();
                    expect(subject.P & 0x80).to.be.truthy; });
                it("sets PC to the next opcode", function() {
                    subject.doInstruction();
                    expect(subject.PC).to.equal(0x0001); });
                it("takes 2 cycles", function() {
                    subject.doInstruction();
                    expect(subject.tick).to.equal(2); });
            });
            
            describe("#BIT(zero)",      function() {
                beforeEach(function() {
                    subject.ram = [0x24, 0x02, 0x55];
                });
                it("sets Z flag if result of the AND is zero", function() {
                    subject.A = 0xAA;
                    subject.doInstruction();
                    expect(subject.P & 0x02).to.be.truthy; });
                it("clears Z flag if result of the AND is non-zero", function() {
                    subject.A = 0x44;
                    subject.doInstruction();
                    expect(subject.P & 0x02).to.be.falsy; });
                it("sets V flag if bit 6 of memory location is set", function() {
                    subject.ram[2] = 0x40;
                    subject.doInstruction();
                    expect(subject.P & 0x40).to.be.truthy; });
                it("sets N flag if bit 7 of memory location is set", function() {
                    subject.ram[2] = 0x80;
                    subject.doInstruction();
                    expect(subject.P & 0x80).to.be.truthy; });
                it("sets PC to the next opcode", function() {
                    subject.doInstruction();
                    expect(subject.PC).to.equal(0x0002); });
                it("takes 3 cycles", function() {
                    subject.doInstruction();
                    expect(subject.tick).to.equal(3); });
            });
            describe("#CMP(immediate)", function() {
                beforeEach(function() {
                    subject.ram = [0xC9, 0x10];
                });
                context("when A > Memory", function() {
                    beforeEach(function() {
                        subject.A = 0x18;
                        subject.doInstruction();
                    });
                    it("sets C flag",   function() { expect(subject.P & 0x01).to.be.truthy; });
                    it("clears Z flag", function() { expect(subject.P & 0x02).to.be.falsy; });
                });
                context("when A = Memory", function() {
                    beforeEach(function() {
                        subject.A = 0x10;
                        subject.doInstruction();
                    });
                    it("sets C flag",   function() { expect(subject.P & 0x01).to.be.truthy; });
                    it("sets Z flag",   function() { expect(subject.P & 0x02).to.be.truthy; });
                });
                context("when A < Memory", function() {
                    beforeEach(function() {
                        subject.A = 0x08;
                        subject.doInstruction();
                    });
                    it("clears C flag", function() { expect(subject.P & 0x01).to.be.falsy; });
                    it("clears Z flag", function() { expect(subject.P & 0x02).to.be.falsy; });
                });
                it("sets PC to the next opcode", function() {
                    subject.doInstruction();
                    expect(subject.PC).to.equal(0x0001); });
                it("takes 2 cycles", function() {
                    subject.doInstruction();
                    expect(subject.tick).to.equal(2); });
            });
            describe("#CPX(immediate)", function() {
                beforeEach(function() {
                    subject.ram = [0xE0, 0x10];
                });
                context("when X > Memory", function() {
                    beforeEach(function() {
                        subject.X = 0x18;
                        subject.doInstruction();
                    });
                    it("sets C flag",   function() { expect(subject.P & 0x01).to.be.truthy; });
                    it("clears Z flag", function() { expect(subject.P & 0x02).to.be.falsy; });
                });
                context("when X = Memory", function() {
                    beforeEach(function() {
                        subject.X = 0x10;
                        subject.doInstruction();
                    });
                    it("sets C flag",   function() { expect(subject.P & 0x01).to.be.truthy; });
                    it("sets Z flag",   function() { expect(subject.P & 0x02).to.be.truthy; });
                });
                context("when X < Memory", function() {
                    beforeEach(function() {
                        subject.X = 0x08;
                        subject.doInstruction();
                    });
                    it("clears C flag", function() { expect(subject.P & 0x01).to.be.falsy; });
                    it("clears Z flag", function() { expect(subject.P & 0x02).to.be.falsy; });
                });
                it("sets PC to the next opcode", function() {
                    subject.doInstruction();
                    expect(subject.PC).to.equal(0x0001); });
                it("takes 2 cycles", function() {
                    subject.doInstruction();
                    expect(subject.tick).to.equal(2); });
            });
            describe("#CPY(immediate)", function() {
                beforeEach(function() {
                    subject.ram = [0xC0, 0x10];
                });
                context("when Y > Memory", function() {
                    beforeEach(function() {
                        subject.Y = 0x18;
                        subject.doInstruction();
                    });
                    it("sets C flag",   function() { expect(subject.P & 0x01).to.be.truthy; });
                    it("clears Z flag", function() { expect(subject.P & 0x02).to.be.falsy; });
                });
                context("when Y = Memory", function() {
                    beforeEach(function() {
                        subject.Y = 0x10;
                        subject.doInstruction();
                    });
                    it("sets C flag",   function() { expect(subject.P & 0x01).to.be.truthy; });
                    it("sets Z flag",   function() { expect(subject.P & 0x02).to.be.truthy; });
                });
                context("when Y < Memory", function() {
                    beforeEach(function() {
                        subject.Y = 0x08;
                        subject.doInstruction();
                    });
                    it("clears C flag", function() { expect(subject.P & 0x01).to.be.falsy; });
                    it("clears Z flag", function() { expect(subject.P & 0x02).to.be.falsy; });
                });
                it("sets PC to the next opcode", function() {
                    subject.doInstruction();
                    expect(subject.PC).to.equal(0x0001); });
                it("takes 2 cycles", function() {
                    subject.doInstruction();
                    expect(subject.tick).to.equal(2); });
            });
            
            describe("#ORA(immediate)", function() {
                beforeEach(function() {
                    subject.A = 0xAA;
                    subject.ram = [0x09, 0x00];
                });
                it("does an inclusive OR between A and memory location", function() {
                    subject.ram[1] = 0x0F;
                    subject.doInstruction();
                    expect(subject.A).to.equal(0xAF); });
                it("sets Z flag if zero", function() {
                    subject.A = 0x00;
                    subject.ram[1] = 0x00;
                    subject.doInstruction();
                    expect(subject.P & 0x02).to.be.truthy; });
                it("sets N flag if bit 7 is set", function() {
                    subject.ram[1] = 0x80;
                    subject.doInstruction();
                    expect(subject.P & 0x80).to.be.truthy; });
                it("sets PC to the next opcode", function() {
                    subject.doInstruction();
                    expect(subject.PC).to.equal(0x0002); });
                it("takes 2 cycles", function() {
                    subject.doInstruction();
                    expect(subject.tick).to.equal(2); });
            });
            describe("#AND(immediate)", function() {
                beforeEach(function() {
                    subject.A = 0xAA;
                    subject.ram = [0x29, 0x00];
                });
                it("does a logical AND between A and memory location", function() {
                    subject.ram[1] = 0x0F;
                    subject.doInstruction();
                    expect(subject.A).to.equal(0x0A); });
                it("sets Z flag if zero", function() {
                    subject.ram[1] = 0x00;
                    subject.doInstruction();
                    expect(subject.P & 0x02).to.be.truthy; });
                it("sets N flag if bit 7 is set", function() {
                    subject.ram[1] = 0x80;
                    subject.doInstruction();
                    expect(subject.P & 0x80).to.be.truthy; });
                it("sets PC to the next opcode", function() {
                    subject.doInstruction();
                    expect(subject.PC).to.equal(0x0002); });
                it("takes 2 cycles", function() {
                    subject.doInstruction();
                    expect(subject.tick).to.equal(2); });
            });
            describe("#EOR(immediate)", function() {
                beforeEach(function() {
                    subject.A = 0xAA;
                    subject.ram = [0x49, 0x00];
                });
                it("does an exclusive OR between A and memory location", function() {
                    subject.ram[1] = 0x0F;
                    subject.doInstruction();
                    expect(subject.A).to.equal(0xA5); });
                it("sets Z flag if zero", function() {
                    subject.ram[1] = 0xAA;
                    subject.doInstruction();
                    expect(subject.P & 0x02).to.be.truthy; });
                it("sets N flag if bit 7 is set", function() {
                    subject.ram[1] = 0x7F;
                    subject.doInstruction();
                    expect(subject.P & 0x80).to.be.truthy; });
                it("sets PC to the next opcode", function() {
                    subject.doInstruction();
                    expect(subject.PC).to.equal(0x0002); });
                it("takes 2 cycles", function() {
                    subject.doInstruction();
                    expect(subject.tick).to.equal(2); });
            });
            
            describe("#NOP()", function() {
                beforeEach(function() {
                    subject.ram = [0xEA, 0x00];
                    subject.doInstruction();
                });
                it("sets PC to the next opcode", function() {
                    expect(subject.PC).to.equal(0x0001); });
                it("takes 2 cycles", function() {
                    expect(subject.tick).to.equal(2); });
            });
        });
    });
});
