var expect = chai.expect;

describe("Nestled", function() {
    describe(".Cpu", function() {
        var subject, cartridge;
        var ram    =  [0x10,0x11,0x12,0x13];
        var sram   =  [0x20,0x21,0x22,0x23];
        var PRGRom = [[0x30,0x31,0x32,0x33],Array(0x4000)];
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
        
        //-------------------------------------------------------------------------------//
        
        context("on creation", function() {
            it("sets A to 0", function() { expect(subject.A).to.equal(0); });
            it("sets X to 0", function() { expect(subject.X).to.equal(0); });
            it("sets Y to 0", function() { expect(subject.Y).to.equal(0); });
            it("sets P to 0x34", function()  { expect(subject.P).to.equal(0x34); });
            it("sets the I flag", function() { expect(subject.getInterrupt()).to.be.truthy; });
            it("sets SP to 0x00", function() { expect(subject.SP).to.equal(0x00); });
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
        });
        describe("#readWord(address)", function() {
            it("reads from RAM when address is between [0x0000, 0x07FF]", function() {
                expect(subject.readWord(0x0000)).to.equal(0x1110); });
            it("reads from SRAM when address is between [0x6000, 0x7FFF]", function() {
                expect(subject.readWord(0x6001)).to.equal(0x2221); });
            it("reads from PRG-ROM when address is between [0x8000, 0xFFFF]", function() {
                expect(subject.readWord(0x8002)).to.equal(0x3332); });
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
            beforeEach(function() { subject.PC = 0x8001; });
            
            describe("#imp()", function() {
                it("does nothing...", function() {
                    expect(subject.imp()).to.be; }); //But it does exist
            });
            describe("#imm()", function() {
                it("returns #PC", function() {
                    expect(subject.imm()).to.equal(0x8001); });
            });
            
            describe("#rel(operand)", function() {
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
                beforeEach(function() { operand = subject.read(subject.PC++); });
                
                it("returns the operand(word)", function() {
                    expect(subject.abs(operand)).to.equal(0x3231); });
            });
            describe("#absX(operand)", function() {
                beforeEach(function() {
                    subject.X = 0xF0;
                    operand = subject.read(subject.PC++);
                });
                
                it("returns the operand(word)", function() {
                    expect(subject.absX(operand)).to.equal(0x3321); });
            });
            describe("#absY(operand)", function() {
                beforeEach(function() {
                    subject.Y = 0xFF;
                    operand = subject.read(subject.PC++);
                });
                
                it("returns the operand(word)", function() {
                    expect(subject.absY(operand)).to.equal(0x3330); });
            });
            
            describe("#ind(operand)", function() {
                beforeEach(function() {
                    PRGRom[0][4] = 0x00;
                    PRGRom[0][5] = 0x80;
                    subject.PC = 0x8004;
                    operand = subject.read(subject.PC++);
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
    });
});
