var expect = chai.expect;

describe("Nestled", function() {
    describe(".Mapper", function() {
        var subject;
        
        beforeEach(function() {
            subject = new Nestled.Mapper();
        });
                
        describe("#getName(mapperNumber)", function() {
            it("returns the mapper's name", function() {
                expect(subject.getName(0)).to.equal("NROM");
            });
        });
        describe("#getFormattedName(mapperNumber)", function() {
            it("returns the mapper's name in a more verbose format", function() {
                expect(subject.getFormattedName(0)).to.equal("Mapper #0 : NROM");
            });
        });
    });
});
