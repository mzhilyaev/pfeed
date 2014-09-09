'use strict';

var config = require("../config/config");
var docHelper = require("../modules/DocHelper");
var hostTracker = require("../modules/HostTracker");
var hostKeeper = require("../modules/HostKeeper");


module.exports = {

  initilized: false,

  init: function(done) {
    if (!this.initilized) {
      docHelper.init("test", null, function() {
        hostTracker.init("test", null, function() {
          hostKeeper.init("test", null, function() {
            done();
          });
        });
      });
      this.initilized = true;
    } else {
      done();
    }
  },

  clearHosts: function(done) {
    hostTracker.clarCollection(done);
  },

  clearDocs: function(done) {
    docHelper.clarCollection(done);
  },

  clearAll: function(done) {
    this.clearHosts(function() {
      this.clearDocs(done);
    }.bind(this));
  },

  populateDocs: function(done) {
    var docs = require("./data/TestDbDocs").testDocsGroup1;
    var docCount = 0;
    docs.forEach(function(doc) {
      var clone = JSON.parse(JSON.stringify(doc));
      clone.published = Math.floor(Date.now()/1000) - doc.published * 60 * 60;
      clone.harvested = Math.floor(Date.now()/1000) - doc.harvested * 60 * 60;
      docHelper.addDocument(clone, function() {
        docCount++;
        if (docCount == docs.length) {
          done();
        }
      });
    });
  },

  repopulateDocs: function(done) {
    this.clearDocs(function () {
      this.populateDocs(done);
    }.bind(this));
  },

  getCollection: function() {
    return docHelper.getCollection();
  },

};
