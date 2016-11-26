"use strict";

(function(Nestled, undefined) {
    (function(Utils, undefined) {
        var isMac = (navigator.platform.toLowerCase().indexOf('mac') >= 0);
        
        //Returns the optimized default #renderItem function
        function makeRenderItemFunc(tag, itemsPerRow, modifierFunc) {
            var width = ""+Math.floor(100/itemsPerRow)+"%";
            return eval("(function(value, index) {"+
                "var elem = document.createElement(tag);"+
                (itemsPerRow > 1 ? "elem.style.width = width;" : "")+
                "elem.appendChild(document.createTextNode("+(modifierFunc ? "modifierFunc(value)" : "value")+"));"+
                "return elem;"+
            "})");
        }
        
        /*
        DataChunker parameters:
            data:    Array
          
          required:
            content: String(id) or DOM element
                     (Parent of the rows elements (<ol>, <ul>, <div>, ...) )
            scroll:  String(id) or DOM element
                     (surrounding block element that will contain the scrollbar)
          optional:
            renderItemFunc:   Function
            itemModifierFunc: Function
            tag:              String  (default: tagName of the first child of contentElement)
            noDataText:       String  (default: 'No data')
            noDataClass:      String  (default: 'no-data')
            itemsPerRow:      Integer (default: 1)
            rowsPerBlock:     Integer (default: 50)
            blocksPerChunk:   Integer (default: 2)
        */ 
        function DataChunker(opts) {
            //Required arguments
            this.contentElement = (typeof opts['content'] === 'string') ? document.getElementById(opts['content'])
                                                                        : opts['content'];
            this.scrollElement = (typeof opts['scroll'] === 'string') ? document.getElementById(opts['scroll'])
                                                                      : opts['scroll'];
            
            var node = this.contentElement.children[0];
            
            //Optional arguments
            this.tag            = opts['tag']            || node.tagName.toLowerCase();
            this.noDataText     = opts['noDataText']     || 'No data';
            this.noDataClass    = opts['noDataClass']    || 'no-data';
            this.itemsPerRow    = opts['itemsPerRow']    || 1;
            this.rowsPerBlock   = opts['rowsPerBlock']   || 50;
            this.blocksPerChunk = opts['blocksPerChunk'] || 4;
            
            this.data = opts['data'] || [];
            this.cache = [];
            
            if (opts['itemModifierFunc'] && typeof opts['itemModifierFunc'] === 'function')
                this.itemModifierFunc = opts['itemModifierFunc'];
            
            if (opts['renderItemFunc'] && typeof opts['renderItemFunc'] === 'function')
                this.renderItem = opts['renderItemFunc'];
            else
                this.rebuildRenderItemFunc();
            
            //Variables
            var marginTop    = parseInt(getComputedStyle(node)['marginTop'], 10) || 0;
            var marginBottom = parseInt(getComputedStyle(node)['marginBottom'], 10) || 0;
            this.rowHeight  = node.offsetHeight;
            this.rowHeight += Math.max(marginTop, marginBottom);

            this.itemsPerBlock = this.itemsPerRow * this.rowsPerBlock;
            this.rowsPerChunk = this.rowsPerBlock * this.blocksPerChunk;
            
            this.blockHeight = this.rowsPerBlock * this.rowHeight;
            
            this.scrollTop = 0;
            this.currentChunkIndex = 0;
            this.currentLength = 0;
            this.dirty = true;
            
            //===============================================================//
            
            if(!this.contentElement.hasAttribute('tabindex'))
                this.contentElement.setAttribute('tabindex', 0);
            
            var scrollElement = this.scrollElement;
            var contentElement = this.contentElement;
            
            this.isOrderedList = contentElement.tagName.toLowerCase() == 'ol';
            
            //Scrolling handler
            if (!this.eventsSet[scrollElement.id]) {
                var self = this;
                this.scrollEvent = function() {
                    self.updateScrollPosition(this.scrollTop);
                };
                
                if (isMac) {
                    var macPointerEventsSet = false;
                    var contentElementStyle = this.contentElement.style;
                    var scrollDebounce = 0;
                    
                    scrollElement.addEventListener('scroll', function() {
                        // fixes scrolling issue on Mac
                        if (!macPointerEventsSet) {
                            contentElementStyle.pointerEvents = 'none';
                            macPointerEventsSet = true;
                        }
                        clearTimeout(scrollDebounce);
                        scrollDebounce = setTimeout(function() {
                            contentElementStyle.pointerEvents = 'auto';
                            macPointerEventsSet = false;
                        }, 50);
                    }, false);
                }
                scrollElement.addEventListener('scroll', this.scrollEvent, false);
                this.eventsSet[scrollElement.id] = true;
            }
            
            var scrollTop = scrollElement.scrollTop;
            this.updateDOM();
            scrollElement.scrollTop = scrollTop;
        }
        
        DataChunker.prototype = {
            constructor: DataChunker,
            
            eventsSet: {}, //pseudo class variable
            scrollEvent: null,
            renderItem: null,
            rebuildRenderItemFunc: function() {
                this.renderItem = makeRenderItemFunc(this.tag, this.itemsPerRow, this.itemModifierFunc);
            },
            
            isEmpty: function() {
                return !this.currentLength; },
            getItemsCount: function() {
                return this.currentLength; },
            getRowsCount: function() {
                return Math.ceil(this.currentLength / this.itemsPerRow); },
            getBlocksCount: function() {
                return Math.ceil(this.currentLength / (this.itemsPerRow*this.rowsPerBlock)); },
            getChunksCount: function() {
                return Math.ceil(this.currentLength / (this.itemsPerRow*this.rowsPerChunk)); },
            
            getScrollPosition: function() {
                var totalHeight = this.getTotalHeight();
                var windowHeight = this.getWindowHeight();
                return totalHeight<windowHeight ? 100.0 : (this.scrollTop+windowHeight)/totalHeight*100;
            },
            getTotalHeight: function() {
                return this.getRowsCount() * this.rowHeight; },
            getWindowHeight: function() {
                return this.scrollElement.offsetHeight; },
            
            updateScrollPosition: function(scrollTop) {
                this.scrollTop = scrollTop;
                var newChunkIndex = Math.floor(scrollTop/this.blockHeight);
                if (newChunkIndex != this.currentChunkIndex) {
                    this.dirty = true;
                    this.currentChunkIndex = newChunkIndex;
                }
                this.updateDOM();
            },
            
            createExtraRow: function(className, height) {
                var elem = document.createElement(this.tag);
                elem.className = className;
                if (height) elem.style.height = height + "px";
                return elem;
            },
            createEmptyRow: function() {
                var elem = document.createElement(this.tag);
                elem.className = this.noDataClass;
                elem.appendChild(document.createTextNode(this.noDataText));
                return elem;
            },
            getEmptyRow: function() {
                return this.emptyRow || (this.emptyRow = this.createEmptyRow());
            },
            
            renderBlock: function(index) {
                var block = document.createDocumentFragment();
                var itemIndex = index * this.itemsPerBlock;
                this.data.slice(itemIndex, itemIndex+this.itemsPerBlock).forEach((function(value, index) {
                    block.appendChild(this.renderItem(value, index));
                }).bind(this));
                return block;
            },
            getBlock: function(index) {
                var cache = this.cache;
                if (cache[index]) {
                    var renderBlockFunc = this.renderBlock.bind(this);
                    if (index > 0 && !cache[index-1])
                        setTimeout(function() { cache[index-1] = renderBlockFunc(index-1); });
                    if (index < this.getBlocksCount()-2 && !cache[index+1])
                        setTimeout(function() { cache[index+1] = renderBlockFunc(index+1); });
                    return cache[index];
                } else {
                    var block = this.renderBlock(index);
                    if (index < this.getBlocksCount()-1)
                        cache[index] = block;
                    return block;
                }
            },
            getChunk: function(index) {
                var last = Math.min(index + this.blocksPerChunk, this.getBlocksCount());
                var chunk = document.createDocumentFragment();
                while (index < last)
                    chunk.appendChild(this.getBlock(index++).cloneNode(true));
                return chunk;
            },
            
            updateDOM: function() {
                var contentElement = this.contentElement;
                if (this.dirty) {
                    while (contentElement.firstChild)
                        contentElement.removeChild(contentElement.firstChild);
                    
                    if (this.isEmpty()) {
                        contentElement.appendChild(this.getEmptyRow());
                    } else {
                        var chunkIndex = this.currentChunkIndex;
                        if (chunkIndex) chunkIndex--;
                        var startRow = chunkIndex * this.rowsPerBlock;
                        var endRow = startRow + this.rowsPerChunk;
                        
                        var topOffset = startRow * this.rowHeight;
                        if (topOffset) {
                            contentElement.appendChild(this.createExtraRow('keep-parity'));
                            contentElement.appendChild(this.createExtraRow('top-space', topOffset));
                            startRow--;
                        }
                        
                        contentElement.appendChild(this.getChunk(chunkIndex));
                        
                        var bottomOffset = Math.max((this.getRowsCount() - endRow) * this.rowHeight, 0);
                        if (bottomOffset)
                            contentElement.appendChild(this.createExtraRow('bottom-space', bottomOffset));
                        
                        if (this.isOrderedList)
                            contentElement.setAttribute('start', startRow+1);
                    }
                    this.dirty = false;
                }
                contentElement.style.height = ""+this.getTotalHeight()+"px";
            },
            
            update: function(force) {
                var scrollElement = this.scrollElement;
                var scrollTop = scrollElement.scrollTop;
                var atBottom = this.getScrollPosition() >= 99.0;
                if (force || this.data.length != this.currentLength) {
                    this.currentLength = this.data.length;
                    this.cache = [];
                    this.dirty = true;
                }
                this.updateDOM();
                scrollElement.scrollTop = atBottom ? scrollElement.scrollHeight : scrollTop;
            }
        }
        
        Utils.DataChunker = DataChunker;
    })(Nestled.Utils = Nestled.Utils || {});
})(window.Nestled = window.Nestled || {});