var expect = chai.expect;

describe("Nestled", function() {
    describe(".Ppu", function() {
        var subject, pseudoNes;
        var CHRRom = [[0x30,0x31,0x32,0x33]];
        var vram   = [[0x40,0x41,0x42,0x43],
                      [0x48,0x49,0x4A,0x4B]];
        var oam    =  [0x50,0x51,0x52,0x53];
        var bkgPalette = [0x3F,0x01,0x02,0x03,0x04,0x05,0x06,0x07,0x08,0x09,0x0A,0x0B,0x0C,0x0D,0x0E,0x0F];
        var sprPalette = [0x10,0x11,0x12,0x13,0x14,0x15,0x16,0x17,0x18,0x19,0x1A,0x1B,0x1C,0x1D,0x1E,0x1F];
        
        beforeEach(function() {
            pseudoNes = {cartridge: new Nestled.Cartridge({CHRRom: CHRRom})};
            subject   = new Nestled.Ppu(pseudoNes);
            
            subject.vram = [vram[0].slice(0),vram[1].slice(0)];
            subject.oam = oam.slice(0);
            subject.bkgPalette.setBytes(0, bkgPalette);
            subject.sprPalette.setBytes(0, sprPalette);
        });
        
        it("can be turned on",  function() { expect(subject).to.respondTo('powerOn'); });
        it("can be turned off", function() { expect(subject).to.respondTo('powerOff'); });
        
        //-------------------------------------------------------------------------------//
        
        describe("#powerOn()", function() {
            beforeEach(function() { subject.powerOn(); });
            
            it("sets isPowered", function() { expect(subject.isPowered).to.be.true });
            
            it("clears Control Register", function() {
                expect(subject.baseNametableAddress).to.equal(0x2000);
                expect(subject.addToXScroll).to.equal(0);
                expect(subject.addToYScroll).to.equal(0);
                expect(subject.addressIncrement).to.equal(1);
                expect(subject.sprPatternTableAddress).to.equal(0);
                expect(subject.bkgPatternTableAddress).to.equal(0);
                expect(subject.sprite8x16).to.equal(0);
                expect(subject.nmiEnabled).to.equal(0);
            });
            it("clears Mask Register", function() {
                expect(subject.grayscale).to.equal(0);
                expect(subject.showLeftMostBackground).to.equal(0);
                expect(subject.showLeftMostSprites).to.equal(0);
                expect(subject.showBackground).to.equal(0);
                expect(subject.showSprites).to.equal(0);
                expect(subject.emphasisRed).to.equal(0);
                expect(subject.emphasisGreen).to.equal(0);
                expect(subject.emphasisBlue).to.equal(0);
                
            });
            it("clears Sprite0Hit", function() {
                expect(subject.sprite0Hit).to.equal(0); });
            it("clears OAM Address", function() {
                expect(subject.oamAddress).to.equal(0); });
            it("clears Scroll Registers", function() {
                expect(subject.scrollX).to.equal(0);
                expect(subject.scrollY).to.equal(0); });
            it("clears Address Buffer", function() {
                expect(subject.addressBuffer).to.equal(0); });
            it("clears Read Buffer", function() {
                expect(subject.readBuffer).to.equal(0); });
        });
        
        describe("#powerOff()", function() {
            beforeEach(function() { subject.powerOff(); });
            
            it("clears isPowered", function() { expect(subject.isPowered).to.be.false; });
        });
        
        describe("#reset()", function() {
            beforeEach(function() { subject.reset(); });
            
            it("clears Control Register", function() {
                expect(subject.baseNametableAddress).to.equal(0x2000);
                expect(subject.addToXScroll).to.equal(0);
                expect(subject.addToYScroll).to.equal(0);
                expect(subject.addressIncrement).to.equal(1);
                expect(subject.sprPatternTableAddress).to.equal(0);
                expect(subject.bkgPatternTableAddress).to.equal(0);
                expect(subject.sprite8x16).to.equal(0);
                expect(subject.nmiEnabled).to.equal(0);
            });
            it("clears Mask Register", function() {
                expect(subject.grayscale).to.equal(0);
                expect(subject.showLeftMostBackground).to.equal(0);
                expect(subject.showLeftMostSprites).to.equal(0);
                expect(subject.showBackground).to.equal(0);
                expect(subject.showSprites).to.equal(0);
                expect(subject.emphasisRed).to.equal(0);
                expect(subject.emphasisGreen).to.equal(0);
                expect(subject.emphasisBlue).to.equal(0);
                
            });
            it("clears Scroll Registers", function()  {
                expect(subject.scrollX).to.equal(0);
                expect(subject.scrollY).to.equal(0); });
            it("clears Read Buffer", function() {
                expect(subject.readBuffer).to.equal(0); });
        });
        
        //-------------------------------------------------------------------------------//
        
        describe("#read(address)", function() {
            context("when address is 0x2002", function() {
                beforeEach(function() { subject.addressBuffer = 0xAAAA; });
                
                it("clears addressBuffer after read", function() {
                    subject.read(0x2002);
                    expect(subject.addressBuffer).to.equal(0);
                });
                
                context("and VBlank is set", function() {
                    beforeEach(function() { subject.setVBlank(); });
                    
                    it("returns 0x80", function() {
                        expect(subject.read(0x2002)).to.equal(0x80); });
                    it("clears VBlank after read", function() {
                        subject.read(0x2002);
                        expect(subject.read(0x2002)).to.equal(0x00);
                    });
                });
                context("and Sprite0Hit is set", function() {
                    beforeEach(function() { subject.setSprite0Hit(); });
                    
                    it("returns 0x40", function() {
                        expect(subject.read(0x2002)).to.equal(0x40); });
                });
                context("and SpriteOverflow is set", function() {
                    beforeEach(function() { subject.setSpriteOverflow(); });
                    
                    it("returns 0x20", function() {
                        expect(subject.read(0x2002)).to.equal(0x20); });
                });
                context("and all are set", function() {
                    beforeEach(function() {
                        subject.setVBlank();
                        subject.setSprite0Hit();
                        subject.setSpriteOverflow();
                    });
                    
                    it("returns 0xE0", function() {
                        expect(subject.read(0x2002)).to.equal(0xE0); });
                    it("clears VBlank after read", function() {
                        subject.read(0x2002);
                        expect(subject.read(0x2002)).to.equal(0x60);
                    });
                });
            });
            context("when address is 0x2004", function() {
                beforeEach(function() { subject.oamAddress = 0x00; });
                
                context("and VBlank is set", function() {
                    beforeEach(function() { subject.setVBlank(); });
                    
                    it("returns the value of oam[oamAddress]", function() {
                        expect(subject.read(0x2004)).to.equal(0x50); });
                    it("does not increment oamAddress", function() {
                        subject.read(0x2004);
                        expect(subject.oamAddress).to.equal(0x00);
                    });
                });
                context("and VBlank is clear", function() {
                    beforeEach(function() { subject.clearVBlank(); });
                    
                    it("returns the value of oam[oamAddress]", function() {
                        expect(subject.read(0x2004)).to.equal(0x50); });
                    it("increments oamAddress", function() {
                        subject.read(0x2004);
                        expect(subject.oamAddress).to.equal(0x01);
                    });
                });
            });
            context("when address is 0x2007", function() {
                context("and addressBuffer [0x0000,0x1FFF]", function() {
                    beforeEach(function() { subject.addressBuffer = 0x0000; });
                    
                    it("first returns the content of readBuffer", function() {
                        var readBuffer = subject.readBuffer;
                        expect(subject.read(0x2007)).to.equal(readBuffer);
                    });
                    it("then reads from cartridge (CHR-Rom)", function() {
                        subject.read(0x2007);
                        expect(subject.read(0x2007)).to.equal(0x30);
                    });
                    it("increments addressBuffer by addressIncrement", function() {
                        subject.addressIncrement = 1;
                        subject.read(0x2007);
                        expect(subject.addressBuffer).to.equal(0x0001)
                        
                        subject.addressIncrement = 32;
                        subject.read(0x2007);
                        expect(subject.addressBuffer).to.equal(0x0021)
                    });
                });
                context("and addressBuffer [0x2000,0x3EFF]", function() {
                    beforeEach(function() { subject.addressBuffer = 0x2000; });
                    
                    it("first returns the content of readBuffer", function() {
                        var readBuffer = subject.readBuffer;
                        expect(subject.read(0x2007)).to.equal(readBuffer);
                    });
                    it("then reads from VRAM", function() {
                        subject.read(0x2007);
                        expect(subject.read(0x2007)).to.equal(0x40);
                    });
                    it("increments addressBuffer by addressIncrement", function() {
                        subject.addressIncrement = 1;
                        subject.read(0x2007);
                        expect(subject.addressBuffer).to.equal(0x2001)
                        
                        subject.addressIncrement = 32;
                        subject.read(0x2007);
                        expect(subject.addressBuffer).to.equal(0x2021)
                    });
                });
                context("and addressBuffer [0x3F00,0x3FFF]", function() {
                    beforeEach(function() {
                        subject.addressBuffer = 0x3F00;
                        subject.vram[0][0x3F00&0x3FF] = 0x2A; //Mirror of 0x3F00...
                    });
                    
                    it("reads immediately from palette data", function() {
                        expect(subject.read(0x2007)).to.equal(0x3F);
                    });
                    it("does put data into readBuffer", function() {
                        expect(subject.read(0x2007)).to.equal(0x3F);
                        subject.addressBuffer = 0x0000;
                        expect(subject.read(0x2007)).to.equal(0x2A);
                        expect(subject.read(0x2007)).to.equal(0x30);
                    });
                });
            });
        });
        
        describe("#write(address, data)", function() {
            context("when address is 0x2000", function() {
                var address = 0x2000;
                
                context("and data is 0x00", function() {
                    beforeEach(function() { subject.write(address, 0x00); });
                    
                    //This is a bit lazy but I don't think it's worth
                    //having a separate test for each...
                    it("sets Control Register accordingly", function() {
                        expect(subject.baseNametableAddress).to.equal(0x2000);
                        expect(subject.addToXScroll).to.equal(0);
                        expect(subject.addToYScroll).to.equal(0);
                        expect(subject.addressIncrement).to.equal(1);
                        expect(subject.sprPatternTableAddress).to.equal(0x0000);
                        expect(subject.bkgPatternTableAddress).to.equal(0x0000);
                        expect(subject.sprite8x16).to.be.falsy;
                        expect(subject.vblank).to.be.falsy;
                    });
                });
                context("data is 0xFF", function() {
                    beforeEach(function() { subject.write(address, 0xFF); });
                    
                    it("sets Control Register accordingly", function() {
                        expect(subject.baseNametableAddress).to.equal(0x2C00);
                        expect(subject.addToXScroll).to.equal(256);
                        expect(subject.addToYScroll).to.equal(240);
                        expect(subject.addressIncrement).to.equal(32);
                        expect(subject.sprPatternTableAddress).to.equal(0x1000);
                        expect(subject.bkgPatternTableAddress).to.equal(0x1000);
                        expect(subject.sprite8x16).to.be.truthy;
                        expect(subject.nmiEnabled).to.be.truthy;
                    });
                });
            });
            context("when address is 0x2001", function() {
                var address = 0x2001;
                
                context("and data is 0x00", function() {
                    beforeEach(function() { subject.write(address, 0x00); });
                    
                    it("sets Mask Register accordingly", function() {
                        expect(subject.grayscale).to.be.falsy;
                        expect(subject.showLeftMostBackground).to.be.falsy;
                        expect(subject.showLeftMostSprites).to.be.falsy;
                        expect(subject.showBackground).to.be.falsy;
                        expect(subject.showSprites).to.be.falsy;
                        expect(subject.emphasisRed).to.be.falsy;
                        expect(subject.emphasisGreen).to.be.falsy;
                        expect(subject.emphasisBlue).to.be.falsy;
                    });
                });
                context("and data is 0xFF", function() {
                    beforeEach(function() { subject.write(address, 0xFF); });
                    
                    it("sets Mask Register accordingly", function() {
                        expect(subject.grayscale).to.be.truthy;
                        expect(subject.showLeftMostBackground).to.be.truthy;
                        expect(subject.showLeftMostSprites).to.be.truthy;
                        expect(subject.showBackground).to.be.truthy;
                        expect(subject.showSprites).to.be.truthy;
                        expect(subject.emphasisRed).to.be.truthy;
                        expect(subject.emphasisGreen).to.be.truthy;
                        expect(subject.emphasisBlue).to.be.truthy;
                    });
                });
            });
            context("when address is 0x2003", function() {
                var address = 0x2003;
                beforeEach(function() { subject.write(address, 0xAA) });
                
                it("writes data to oamAddress", function() {
                    expect(subject.oamAddress).to.equal(0xAA);
                });
            });
            context("when address is 0x2004", function() {
                var address = 0x2004;
                beforeEach(function() {
                    subject.oamAddress = 0x00;
                    subject.write(address, 0xAA)
                });
                
                it("writes data to oam[oamAddress]", function() {
                    expect(subject.oam[0]).to.equal(0xAA);
                });
            });
            context("when address is 0x2005", function() {
                var address = 0x2005;
                beforeEach(function() {
                    subject.write(address, 0xAA)
                    subject.write(address, 0xBB)
                });
                
                it("writes data to scrollX the first time", function() {
                    expect(subject.scrollX).to.equal(0xAA);
                });
                it("writes data to scrollY the second time", function() {
                    expect(subject.scrollY).to.equal(0xBB);
                });
            });
            context("when address is 0x2006", function() {
                var address = 0x2006;
                
                it("writes the upper byte of addressBuffer the first time", function() {
                    subject.write(address, 0xAB);
                    expect(subject.addressBuffer).to.equal(0xAB00);
                });
                it("writes the lower byte of addressBuffer the second time", function() {
                    subject.write(address, 0xAB);
                    subject.write(address, 0xCD);
                    expect(subject.addressBuffer).to.equal(0xABCD);
                });
            });
            context("when address is 0x2007", function() {
                var address = 0x2007;
                
                context("and addressBuffer [0x0000,0x1FFF]", function() {
                    beforeEach(function() { subject.addressBuffer = 0x0000; });
                    
                    it("cannot write to cartridge (CHR-Rom)", function() {
                        subject.write(0x2007, 0xAA);
                        expect(subject.bus.cartridge.CHRRom[0][0]).to.equal(0x30);
                    });
                    it("does increment addressBuffer by addressIncrement", function() {
                        subject.addressIncrement = 1;
                        subject.write(0x2007, 0xAA);
                        expect(subject.addressBuffer).to.equal(0x0001)
                        
                        subject.addressIncrement = 32;
                        subject.write(0x2007, 0xAA);
                        expect(subject.addressBuffer).to.equal(0x0021)
                    });
                });
                context("and addressBuffer [0x2000,0x3EFF]", function() {
                    beforeEach(function() { subject.addressBuffer = 0x2000; });
                    
                    it("writes to VRAM", function() {
                        subject.write(0x2007, 0xAA);
                        expect(subject.vram[0][0]).to.equal(0xAA);
                    });
                    it("increments addressBuffer by addressIncrement", function() {
                        subject.addressIncrement = 1;
                        subject.write(0x2007, 0xAA);
                        expect(subject.addressBuffer).to.equal(0x2001)
                        
                        subject.addressIncrement = 32;
                        subject.write(0x2007, 0xAA);
                        expect(subject.addressBuffer).to.equal(0x2021)
                    });
                });
                context("and addressBuffer [0x3F00,0x3FFF]", function() {
                    beforeEach(function() { subject.addressBuffer = 0x3F00; });
                    
                    it("writes to palette data", function() {
                        subject.write(0x2007, 0x2A);
                        expect(subject.bkgPalette.rawBuffer[0]).to.equal(0x2A);
                    });
                });
            });
        });
        
        //-------------------------------------------------------------------------------//
        
        describe("#readData(address)", function() {
            it("reads from cartridge (CHR-ROM) when address < 0x2000", function() {
                expect(subject.readData(0x0000)).to.equal(0x30);
            });
            it("reads from VRAM when address >= 0x2000", function() {
                expect(subject.readData(0x2001)).to.equal(0x41);
            });
            context("when cartridge has horizontal mirroring", function() {
                beforeEach(function() { subject.bus.cartridge.horizontalMirroring = true; });
                
                it("reads from vram[0] when address [0x2000-0x23FF]", function() {
                    expect(subject.readData(0x2002)).to.equal(0x42);
                });
                it("reads from vram[0] when address [0x2400-0x27FF]", function() {
                    expect(subject.readData(0x2402)).to.equal(0x42);
                });
                it("reads from vram[1] when address [0x2800-0x2BFF]", function() {
                    expect(subject.readData(0x2802)).to.equal(0x4A);
                });
                it("reads from vram[1] when address [0x2C00-0x2FFF]", function() {
                    expect(subject.readData(0x2C02)).to.equal(0x4A);
                });
            });
            context("when cartridge has vertical mirroring", function() {
                beforeEach(function() { subject.bus.cartridge.verticalMirroring = true; });
                
                it("reads from vram[0] when address [0x2000-0x23FF]", function() {
                    expect(subject.readData(0x2003)).to.equal(0x43);
                });
                it("reads from vram[1] when address [0x2400-0x2BFF]", function() {
                    expect(subject.readData(0x2403)).to.equal(0x4B);
                });
                it("reads from vram[0] when address [0x2800-0x2BFF]", function() {
                    expect(subject.readData(0x2803)).to.equal(0x43);
                });
                it("reads from vram[1] when address [0x2C00-0x2FFF]", function() {
                    expect(subject.readData(0x2C03)).to.equal(0x4B);
                });
            });
        });
        
        describe("#writeData(address, data)", function() {
            it("cannot write to cartridge (CHR-ROM) when address < 0x2000", function() {
                subject.writeData(0x0000, 0xFF);
                expect(subject.bus.cartridge.CHRRom[0][0]).to.equal(0x30);
            });
            it("writes to VRAM when address >= 0x2000", function() {
                subject.writeData(0x2001, 0xFF);
                expect(subject.vram[0][0x1]).to.equal(0xFF);
            });
            context("when cartridge has horizontal mirroring", function() {
                beforeEach(function() { subject.bus.cartridge.horizontalMirroring = true; });
                
                it("writes to vram[0] when address [0x2000-0x23FF]", function() {
                    subject.writeData(0x2002, 0xFF);
                    expect(subject.vram[0][0x2]).to.equal(0xFF);
                });
                it("writes to vram[0] when address [0x2400-0x27FF]", function() {
                    subject.writeData(0x2402, 0xFF);
                    expect(subject.vram[0][0x2]).to.equal(0xFF);
                });
                it("writes to vram[1] when address [0x2800-0x2BFF]", function() {
                    subject.writeData(0x2802, 0xFF);
                    expect(subject.vram[1][0x2]).to.equal(0xFF);
                });
                it("writes to vram[1] when address [0x2C00-0x2FFF]", function() {
                    subject.writeData(0x2C02, 0xFF);
                    expect(subject.vram[1][0x2]).to.equal(0xFF);
                });
            });
            context("when cartridge has vertical mirroring", function() {
                beforeEach(function() { subject.bus.cartridge.verticalMirroring = true; });
                
                it("writes to vram[0] when address [0x2000-0x23FF]", function() {
                    subject.writeData(0x2002, 0xFF);
                    expect(subject.vram[0][0x2]).to.equal(0xFF);
                });
                it("writes to vram[1] when address [0x2400-0x27FF]", function() {
                    subject.writeData(0x2402, 0xFF);
                    expect(subject.vram[1][0x2]).to.equal(0xFF);
                });
                it("writes to vram[0] when address [0x2800-0x2BFF]", function() {
                    subject.writeData(0x2802, 0xFF);
                    expect(subject.vram[0][0x2]).to.equal(0xFF);
                });
                it("writes to vram[1] when address [0x2C00-0x2FFF]", function() {
                    subject.writeData(0x2C02, 0xFF);
                    expect(subject.vram[1][0x2]).to.equal(0xFF);
                });
            });
        });
        
        describe("#readPalette(address)", function() {
            it("reads from bkgPalette when address [0x3F01-0x3F0F]", function() {
                expect(subject.readPalette(0x3F01)).to.equal(0x01);
            });
            it("reads from sprPalette when address [0x3F11-0x3F1F]", function() {
                expect(subject.readPalette(0x3F11)).to.equal(0x11);
            });
            it("always reads 'Universal background color' when bit 0-1 are clear", function() {
                expect(subject.readPalette(0x3F00)).to.equal(0x3F);
                expect(subject.readPalette(0x3F04)).to.equal(0x3F);
                expect(subject.readPalette(0x3F08)).to.equal(0x3F);
                expect(subject.readPalette(0x3F0C)).to.equal(0x3F);
                expect(subject.readPalette(0x3F10)).to.equal(0x3F);
                expect(subject.readPalette(0x3F14)).to.equal(0x3F);
                expect(subject.readPalette(0x3F18)).to.equal(0x3F);
                expect(subject.readPalette(0x3F1C)).to.equal(0x3F);
            });
        });
        
        describe("#writePalette(address, data)", function() {
            it("writes to bkgPalette when address [0x3F01-0x3F0F]", function() {
                subject.writePalette(0x3F01, 0x15);
                expect(subject.bkgPalette.rawBuffer[1]).to.equal(0x15);
            });
            it("writes to sprPalette when address [0x3F11-0x3F1F]", function() {
                subject.writePalette(0x3F11, 0x15);
                expect(subject.sprPalette.rawBuffer[1]).to.equal(0x15);
            });
            it("writes to bkgPalette when address 0x3F0[0,4,8,C]", function() {
                subject.writePalette(0x3F00, 0x15);
                expect(subject.bkgPalette.rawBuffer[0]).to.equal(0x15);
                subject.writePalette(0x3F04, 0x16);
                expect(subject.bkgPalette.rawBuffer[4]).to.equal(0x16);
                subject.writePalette(0x3F08, 0x17);
                expect(subject.bkgPalette.rawBuffer[8]).to.equal(0x17);
                subject.writePalette(0x3F0C, 0x18);
                expect(subject.bkgPalette.rawBuffer[12]).to.equal(0x18);
            });
            it("also writes to bkgPalette when address 0x3F1[0,4,8,C]", function() {
                subject.writePalette(0x3F10, 0x15);
                expect(subject.bkgPalette.rawBuffer[0]).to.equal(0x15);
                expect(subject.sprPalette.rawBuffer[0]).to.equal(0x10);
                
                subject.writePalette(0x3F14, 0x16);
                expect(subject.bkgPalette.rawBuffer[4]).to.equal(0x16);
                expect(subject.sprPalette.rawBuffer[4]).to.equal(0x14);
                
                subject.writePalette(0x3F18, 0x17);
                expect(subject.bkgPalette.rawBuffer[8]).to.equal(0x17);
                expect(subject.sprPalette.rawBuffer[8]).to.equal(0x18);
                
                subject.writePalette(0x3F1C, 0x18);
                expect(subject.bkgPalette.rawBuffer[12]).to.equal(0x18);
                expect(subject.sprPalette.rawBuffer[12]).to.equal(0x1C);
            });
        });
    });
});
