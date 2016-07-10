var expect = chai.expect;

describe("Nestled", function() {
    describe(".Nes", function() {
        var subject = new Nestled.Nes;
        
        afterEach(function() { subject.powerOff(); });
        
        it("can be turned on",  function() { expect(subject).to.respondTo('powerOn'); });
        it("can be turned off", function() { expect(subject).to.respondTo('powerOff'); });
        
        describe("#isPoweredOn", function() {
            it("returns -false- when the NES is off", function() {
                subject.powerOff();
                expect(subject.isPoweredOn()).to.be.false; });
            it("returns -true- when the NES is on", function() {
                subject.powerOn();
                expect(subject.isPoweredOn()).to.be.true; });
        });
        describe("#isPoweredOff", function() {
            it("returns -true- when the NES is off", function() {
                subject.powerOff();
                expect(subject.isPoweredOff()).to.be.true; });
            it("returns -false- when the NES is on", function() {
                subject.powerOn();
                expect(subject.isPoweredOff()).to.be.false; });
        });
        
        describe("#pressPower()", function() {
            context("when it is off", function() {
                beforeEach(function() { subject.powerOff(); });
                
                it("returns -true-", function() {
                    expect(subject.pressPower()).to.be.true;
                });
                it("becomes powered on", function() {
                    subject.pressPower();
                    expect(subject.isPoweredOn()).to.be.true;
                });
                it("turns on the Front LED", function() {
                    subject.pressPower();
                    expect(subject.FrontLEDState()).to.equal('1');
                });
            });
            context("when it is on", function() {
                beforeEach(function() { subject.powerOn(); });
                
                it("returns -false-", function() {
                    expect(subject.pressPower()).to.be.false;
                });
                it("becomes powered off", function() {
                    subject.pressPower();
                    expect(subject.isPoweredOff()).to.be.true;
                });
                it("turns off the Front LED", function() {
                    subject.pressPower();
                    expect(subject.FrontLEDState()).to.equal('0');
                });
            });
        });
        
        //-------------------------------------------------------------------------------//
        
        describe("#insertCartridge(cartridge)", function() {
            var cartridge = "This is a cartridge";
            
            it("sets -this.cartridge-", function() {
                expect(function() {
                    subject.insertCartridge(cartridge);
                }).to.change(subject, 'cartridge');
                expect(subject.cartridge).to.equal(cartridge);
            });
            it("returns the inserted cartridge", function() {
                expect(subject.insertCartridge(cartridge)).to.equal(cartridge);
            });
        });
        describe("#removeCartridge()", function() {
            var cartridge = "This is a cartridge";
            beforeEach(function() { subject.insertCartridge(cartridge); });
            
            it("clears -this.cartridge-", function() {
                expect(function() {
                    subject.removeCartridge();
                }).to.change(subject, 'cartridge');
                expect(subject.cartridge).to.be.undefined;
            });
            it("returns the removed cartridge", function() {
                expect(subject.removeCartridge()).to.equal(cartridge);
            });
        });
        describe("#blowIntoCartridge()", function(){
            var cartridge = "This is a cartridge";
            beforeEach(function() { subject.insertCartridge(cartridge); });
            
            it("works, as always", function() {
                subject.blowIntoCartridge();
                expect(cartridge).to.be.ok;
            });
        });
        
        //-------------------------------------------------------------------------------//
        
        describe("#insertJoypad(joypad, position)", function() {
            var joypad1 = "This is joypad 1";
            var joypad2 = "This is joypad 2";
            beforeEach(function() { subject.joypads = []; });
            
            it("inserts the joypad at next availabe position", function() {
                expect(subject.joypads).to.be.empty;
                subject.insertJoypad(joypad1);
                expect(subject.joypads[0]).to.equal(joypad1);
                subject.insertJoypad(joypad2);
                expect(subject.joypads[0]).to.equal(joypad1);
                expect(subject.joypads[1]).to.equal(joypad2);
            });
            it("inserts the joypad at given position", function() {
                subject.insertJoypad(joypad2, 1);
                expect(subject.joypads[1]).to.equal(joypad2);
            });
            it("returns the inserted joypad", function() {
                expect(subject.insertJoypad(joypad1)).to.equal(joypad1);
            });
        });
        describe("#removeJoypad()", function() {
            var joypad1 = "This is joypad 1";
            var joypad2 = "This is joypad 2";
            beforeEach(function() { subject.joypads = [joypad1, joypad2]; });
            
            it("clears the last joypad (by position)", function() {
                subject.removeJoypad();
                expect(subject.joypads[0]).to.equal(joypad1);
                expect(subject.joypads[1]).to.be.undefined;
            });
            it("clears the given joypad (by position)", function() {
                subject.removeJoypad(0);
                expect(subject.joypads[0]).to.be.undefined;
                expect(subject.joypads[1]).to.equal(joypad2);
            });
            it("returns the removed joypad", function() {
                expect(subject.removeJoypad()).to.equal(joypad2);
            });
        });
        describe("#removeAllJoypads()", function() {
            var joypad1 = "This is joypad 1";
            var joypad2 = "This is joypad 2";
            beforeEach(function() { subject.joypads = [joypad1, joypad2]; });

            it("clears all the joypads", function() {
                subject.removeAllJoypads();
                expect(subject.joypads).to.be.empty;
            });
        });

        //-------------------------------------------------------------------------------//
        

    });
});