"use strict";

(function(Nestled, undefined) {
    /*
    File properties:
      file   => File object (Can only be passed as argument to constructor)
      reader => FileReader object
      status => String
      
      name    => String
      size    => Number
      isValid => Boolean
      data    => Blob
    */
    function File(opts) {
        if (opts && opts['file']) {
            this.loadFile(opts['file']);
        } else {
            this.unloadFile();
        }
        this.reader = new FileReader();
        this.reader.onload = this.onloadHandler.bind(this);
        this.reader.onabort = this.onabortHandler.bind(this);
        this.reader.onerror = this.onerrorHandler.bind(this);
    }

    File.prototype = {
        constructor: File,
        
        loadFile: function(file) {
            this.name = file.name;
            this.size = file.size;
            if (!this.name || !this.size)
                return this.isValid = false;
            
            this.reader.readAsArrayBuffer(file);
        },
        unloadFile: function() {
            this.name = "";
            this.size = 0;
            this.status = "";
            this.isValid = null;
            this.data = null;
        },
        abortLoad: function() {
            this.reader.abort();
        },
        
        //Add to a <input type='file' /> element
        //Ex: getElementById('fileInput').addEventListener('change', handleFileSelect, false);
        handleFileSelect: function(e) {
            this.loadFile(e.target.files[0]);
        },
        //Add to a <div> element
        //Ex: getElementById('drop_zone').addEventListener('dragover', handleDragOver, false);
        //    getElementById('drop_zone').addEventListener('drop', handleDrop, false);
        handleDragOver: function(e) {
            e.stopPropagation();
            e.preventDefault();
            e.dataTransfert.dropEffect = 'copy';
        },
        handleDrop: function(e) {
            e.stopPropagation();
            e.preventDefault();
            this.loadFile(e.dataTransfert.files[0]);
        },
        
        //This triggers the "onstatusupdate" event each time the status message is updated
        //
        //Usage example:
        //  var nesFile = new Nestled.File;
        //  nesFile.onstatusupdate = function(e) { console.log(e.target.status); };
        //  nesFile.updateStatus("Loading...");
        updateStatus: function(text, indented) {
            if (indented) text = "  " + text;
            console.log("Nestled: " + text);
            this.status = text;
            if (typeof this.onstatusupdate === "function")
                setTimeout(this.onstatusupdate.bind(null, {target: {status: text}}), 1);
            return this.status;
        },
        
        //This bubbles the "onload" event when the File has been loaded
        onloadHandler: function(e) {
            this.data = e.target.result;
            this.isValid = true;
            if (typeof this.onload === "function")
                setTimeout(this.onload.bind(null, {target: this}), 1);
        },
        onabortHandler: function(e) {
            this.updateStatus("Aborted"); },
        onerrorHandler: function(e) {
            switch(e.target.error.code) {
              case e.target.error.NOT_FOUND_ERR:
                this.updateStatus("File not found"); break;
              case e.target.error.SECURITY_ERR:
                this.updateStatus("File is not accessibe"); break;
              case e.target.error.ABORT_ERR:
                this.updateStatus("Aborted"); break;
              case e.target.error.NOT_READABLE_ERR:
                this.updateStatus("File is not readable"); break;
              default:
                this.updateStatus("An error occurred while reading " + (this.name || "this file"));
            }
        }
    }
    
    Nestled.File = File;
})(window.Nestled = window.Nestled || {});
