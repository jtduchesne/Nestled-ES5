var expect = chai.expect;

describe("Nestled", function() {
    describe(".NoCartridge", function() {
        var subject;
        
        beforeEach(function() {
            subject = new Nestled.NoCartridge;
        });
        
        it("can be read",   function() { expect(subject).to.respondTo('read'); });
        it("can be writen", function() { expect(subject).to.respondTo('write'); });
        
        describe("#read(address)", function() {
            it("always returns zero", function() {
                expect(subject.read(0x6003)).to.equal(0);
                expect(subject.read(0x8002)).to.equal(0);
                expect(subject.read(0xC001)).to.equal(0); });
        });

        describe("#readWord(address)", function() {
            it("always returns zero", function() {
                expect(subject.readWord(0x6000)).to.equal(0);
                expect(subject.readWord(0x8001)).to.equal(0);
                expect(subject.readWord(0xC002)).to.equal(0); });
        });

        describe("#write(address,data)", function() {
            it("does nothing");
        });
    });
});
