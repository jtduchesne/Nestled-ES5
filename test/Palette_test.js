var expect = chai.expect;

describe("Nestled", function() {
    describe(".Palette", function() {
        var subject;
        
        beforeEach(function() {
            subject = new Nestled.Palette;
        });
        
        it("has a canvas",  function() { expect(subject.canvas).to.exist; });
        
        describe(".canvas", function() {
            it("is NOT shared across all instances", function() {
                expect(subject.canvas).not.to.equal((new Nestled.Palette).canvas);
            });
            
            it("defaults to 4x4", function() {
                expect(subject.canvas.width).to.equal(4);
                expect(subject.canvas.height).to.equal(4);
            });
        });
        
        //-------------------------------------------------------------------------------//
        
        describe("#getByte(paletteIndex, colorIndex)", function() {
            beforeEach(function() {
                for (var paletteIndex=0; paletteIndex<subject.palettesCount; paletteIndex++)
                    for (var colorIndex=0; colorIndex<subject.colorsCount; colorIndex++)
                        subject.rawBuffer[paletteIndex*subject.colorsCount+colorIndex] =
                            paletteIndex*10 + colorIndex;
            });
            
            it("returns the content of rawBuffer at the given index", function() {
                expect(subject.getByte(1, 2)).to.equal(12); });
        });
        describe("#setByte(paletteIndex, colorIndex, value)", function() {
            beforeEach(function() {
                subject.setByte(1, 2, 0x3F); });
            
            it("sets the content of rawBuffer at the given index to value", function() {
                expect(subject.getByte(1, 2)).to.equal(0x3F); });
        });
    });
});
