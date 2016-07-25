var expect = chai.expect;

describe("Nestled", function() {
    describe(".File", function() {
        var subject;
        
        beforeEach(function() {
            subject = new Nestled.File();
        });
        
        it("can handle FileSelect", function() { expect(subject).to.respondTo('handleFileSelect'); });
        it("can handle DragOver", function() { expect(subject).to.respondTo('handleDragOver'); });
        it("can handle Drop", function() { expect(subject).to.respondTo('handleDrop'); });
        
        context("on creation", function() {
            it("resets its properties", function() {
                expect(subject.name).to.be.empty;
                expect(subject.size).to.equal(0);
                expect(subject.isValid).to.be.falsy;
                expect(subject.data).to.be.null;
            });
            it("sets #isValid to 'null', not 'false'", function() {
                expect(subject.isValid).to.equal(null); });
            
            // Needs to be tested asynchronously...
            context.skip("if a File is given as parameter", function() {
                beforeEach(function() {
                    subject = new Nestled.File({file: fakeNesFile});
                });
                it("sets fileName", function() {
                    expect(subject.name).to.equal("fake_file.nes"); });
                it("sets fileSize", function() {
                    expect(subject.size).to.equal(0x8010); });
                it("sets data", function() {
                    expect(subject.data).to.have.lengthOf(0x8010); });
            });
        });
        
        describe("#updateStatus(text, indented)", function() {
            beforeEach(function() {
                subject.updateStatus("Updated status"); });
            
            it("sets status", function() {
                expect(subject.status).to.equal("Updated status"); });
            it("triggers the 'onstatusupdate' event");
            
            context("when indented", function() {
                beforeEach(function() {
                    subject.updateStatus("Updated status", true); });
                
                it("indents the status", function() {
                    expect(subject.status).to.equal("  Updated status");
                });
            });
        });
    });
});
