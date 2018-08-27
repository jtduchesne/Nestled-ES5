var expect = chai.expect;

describe("Nestled", function() {
    describe(".PatternTable", function() {
        var subject;
        
        beforeEach(function() {
            subject = new Nestled.PatternTable;
        });
        
        it("has a default palette", function() { expect(subject.palette).to.exist; });
        
        it("has a canvas",  function() { expect(subject.canvas).to.exist; });
        
        describe(".canvas", function() {
            it("is NOT shared across all instances", function() {
                expect(subject.canvas).not.to.equal((new Nestled.PatternTable).canvas);
            });
            
            it("is 128x128", function() {
                expect(subject.canvas.width).to.equal(128);
                expect(subject.canvas.height).to.equal(128);
            });
        });
    });
});
