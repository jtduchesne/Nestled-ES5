var expect = chai.expect;

describe("Nestled", function() {
    describe(".Cartridge", function() {
        var subject;
        var sram   =  [0x10,0x11,0x12,0x13];
        var PRGRom = [[0x20,0x21,0x22,0x23],
                      [0x30,0x31,0x32,0x33]];
        
        beforeEach(function() {
            subject = new Nestled.Cartridge({sram: sram.slice(0), PRGRom: PRGRom});
        });
        
        it("can be read",   function() { expect(subject).to.respondTo('read'); });
        it("can be writen", function() { expect(subject).to.respondTo('write'); });
        
        context("on creation", function() {
            it("defaults to Mapper 0", function() {
                expect(subject.mapperNumber).to.equal(0);
            });
            it("allocates SRAM only if needed", function() {
                expect((new Nestled.Cartridge({sramEnabled: false})).sram).to.be.empty;
                expect((new Nestled.Cartridge({sramEnabled: true })).sram).to.not.be.empty;
            });
        });
        
        describe("#read(address)", function() {
            it("reads from SRAM when address is between [0x6000, 0x7FFF]", function() {
                expect(subject.read(0x6003)).to.equal(0x13); });
            it("reads from PRG-ROM[0] when address is between [0x8000, 0xBFFF]", function() {
                expect(subject.read(0x8002)).to.equal(0x22); });
            it("reads from PRG-ROM[1] when address is between [0xC000, 0xFFFF]", function() {
                expect(subject.read(0xC001)).to.equal(0x31); });
            
            context("when there is only 1 PRG-Rom page", function() {
                var otherSubject = new Nestled.Cartridge({sram: sram, PRGRom: [PRGRom[0]]});
                
                it("mirrors every reads to the first page", function() {
                    expect(otherSubject.read(0xC001)).to.equal(0x21);
                });
            });
        });

        describe("#readWord(address)", function() {
            it("reads from SRAM when address is between [0x6000, 0x7FFF]", function() {
                expect(subject.readWord(0x6000)).to.equal(0x1110); });
            it("reads from PRG-ROM[0] when address is between [0x8000, 0xBFFF]", function() {
                expect(subject.readWord(0x8001)).to.equal(0x2221); });
            it("reads from PRG-ROM[1] when address is between [0xC000, 0xFFFF]", function() {
                expect(subject.readWord(0xC002)).to.equal(0x3332); });
        });

        describe("#write(address,data)", function() {
            it("writes to SRAM when address is between [0x6000, 0x7FFF]", function() {
                subject.write(0x6000, 0xFF);
                expect(subject).to.have.deep.property('sram[0]', 0xFF); });
            it("cannot write to PRG-ROM", function() {
                subject.write(0x8000, 0xFF);
                expect(subject).to.have.deep.property('PRGRom[0][0]', 0x20);
                subject.write(0xC000, 0xFF);
                expect(subject).to.have.deep.property('PRGRom[1][0]', 0x30);
            });
        });
    });
});
