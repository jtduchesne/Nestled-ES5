var expect = chai.expect;

describe("Nestled", function() {
    describe(".Cartridge", function() {
        var subject;
        var sram   =  new Uint8Array([0x10,0x11,0x12,0x13]);
        var PRGRom = [new Uint8Array([0x20,0x21,0x22,0x23]),
                      new Uint8Array([0x30,0x31,0x32,0x33])];
        
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
        
        describe("#createFromFile(file)", function() {
            var testFile;
            var testData = new Uint8Array([0x4E,0x45,0x53,0x1A,0x01,0x01,0xCB,0xD0,
                                           0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00]
                                           .concat((new Array(0x8000)).fill(0xA5))
                                           .concat((new Array(0x4000)).fill(0xC3))
                                                    //Fake iNES File
                                           .concat([0x46,0x61,0x6B,0x65,0x20,0x69,0x4E,0x45,
                                                    0x53,0x20,0x46,0x69,0x6C,0x65,0x00,0x00])).buffer;
            
            beforeEach(function() {
                testFile = {
                    data: testData, size: 0xB020, name: "fake_file.nes", isValid: true,
                    updateStatus: function(text, indent) { return; }
                };
                subject.createFromFile(testFile);
            });
            
            it("returns false if file is invalid", function() {
                testFile.isValid = false;
                expect(subject.createFromFile(testFile)).to.be.false;
            });
            it("returns false if signature is invalid", function() {
                testFile.data = new Blob([0x66,0x61,0x6B,0x65,0x01,0x01,0x00,0x00]);
                expect(subject.createFromFile(testFile)).to.be.false;
            });
            it("returns true if successful", function() {
                expect(subject.createFromFile(testFile)).to.be.true;
            });
            
            it("sets header infos", function() {
                expect(subject.horizontalMirroring).to.be.true;
                expect(subject.verticalMirroring).to.be.false;
                expect(subject.sramEnabled).to.be.true;
                expect(subject.fourscreenMirroring).to.be.true;
            });
            it("sets mapper number", function() {
                expect(subject.mapperNumber).to.equal(0xDC);
            });
            
            it("sets PRG-Rom data", function() {
                expect(subject.PRGRom[0].byteLength).to.equal(0x8000);
                expect(new Uint8Array(subject.PRGRom[0])[0]).to.equal(0xA5);
                expect(new Uint8Array(subject.PRGRom[0]).slice(-1)[0]).to.equal(0xA5);
            });
            it("sets CHR-Rom data", function() {
                expect(subject.CHRRom[0].byteLength).to.equal(0x4000);
                expect(new Uint8Array(subject.CHRRom[0])[0]).to.equal(0xC3);
                expect(new Uint8Array(subject.CHRRom[0]).slice(-1)[0]).to.equal(0xC3);
            });
            
            it("sets name", function() {
                expect(subject.name).to.equal("Fake iNES File");
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
