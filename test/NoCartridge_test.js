var expect = chai.expect;

describe("Nestled", function() {
    describe(".NoCartridge", function() {
        var subject;
        
        beforeEach(function() {
            subject = new Nestled.NoCartridge;
        });
        
        it("can be read by Cpu",   function() { expect(subject).to.respondTo('cpuRead'); });
        it("can be writen by Cpu", function() { expect(subject).to.respondTo('cpuWrite'); });
        
        describe("#cpuRead(address)", function() {
            it("always returns zero", function() {
                expect(subject.cpuRead(0x6003)).to.equal(0);
                expect(subject.cpuRead(0x8002)).to.equal(0);
                expect(subject.cpuRead(0xC001)).to.equal(0); });
        });

        describe("#cpuReadWord(address)", function() {
            it("always returns zero", function() {
                expect(subject.cpuReadWord(0x6000)).to.equal(0);
                expect(subject.cpuReadWord(0x8001)).to.equal(0);
                expect(subject.cpuReadWord(0xC002)).to.equal(0); });
        });

        describe("#cpuWrite(address,data)", function() {
            it("does nothing");
        });
    });
});
