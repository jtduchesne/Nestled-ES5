var expect = chai.expect;

describe("Nestled", function() {
    describe(".Colors", function() {
        var subject;
        
        beforeEach(function() { subject = new Nestled.Colors; });
        
        it("has a canvas",  function() { expect(subject.canvas).to.exist; });
        
        describe(".canvas", function() {
            it("is shared across all instances", function() {
                expect(subject.canvas).to.equal((new Nestled.Colors).canvas);
            });
            
            it("is 16x4", function() {
                expect(subject.canvas.width).to.equal(16);
                expect(subject.canvas.height).to.equal(4);
            });
        });
        
        //-------------------------------------------------------------------------------//
        
        // ( Color #2 is 0x081090FF )
        describe("#getR(index)", function() {
            it("returns the Red portion of the indexed color", function() {
                expect(subject.getR(2)).to.equal(0x08); });
        });
        describe("#getG(index)", function() {
            it("returns the Green portion of the indexed color", function() {
                expect(subject.getG(2)).to.equal(0x10); });
        });
        describe("#getB(index)", function() {
            it("returns the Blue portion of the indexed color", function() {
                expect(subject.getB(2)).to.equal(0x90); });
        });
        describe("#getPixel(index)", function() {
            it("returns the indexed color", function() {
                expect(subject.getPixel(2)).to.equal(0x081090FF); });
        });
    });
});
