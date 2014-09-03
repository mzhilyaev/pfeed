'use strict';

var config = require("../config/config");
var docHelper = require("../modules/DocHelper");
var hostTracker = require("../modules/HostTracker");

docHelper.init("test");
hostTracker.init("test");

module.exports = {

  clearHosts: function(done) {
    hostTracker.clarCollection(done);
  },

  clearDocs: function(done) {
    docHelper.clarCollection(done);
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
