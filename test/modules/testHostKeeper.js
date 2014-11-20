'use strict';
var should = require('should');
var when = require('when');
var helpers = require('../helpers');
var hostTracker = require('../../modules/HostKeeper');
var docHelper = require('../../modules/DocHelper');
var hostTracker = require('../../modules/HostTracker');
var hostKeeper = require('../../modules/HostKeeper');
var utils = require('../../modules/Utils');

before(function(done) {
  helpers.init(done);
});

describe('test host keeper', function(){
  before(function(done) {
    docHelper.clarCollection(function() {
      hostKeeper.clarCollection(function() {
        hostKeeper.readHostTable(done);
      });
    });
  });

  it('test getHostDocs', function(done) {
    should.equal(Object.keys(hostKeeper.hosts).length, 0);
    // insert hosts
    hostTracker.insertHosts(["foo.com", "bar.com", "baz.com"], function() {
      // populate docs
      var docs = helpers.conditionDocArray(
        [
          {id: 10, host: "foo.com"},
          {id: 11, host: "foo.com"},
          {id: 20, host: "bar.com"}
        ]);

      docHelper.insertDocuments(
        docs,
        function() {
          // test getting docs
          hostKeeper.readHostTable(function() {
            should.equal(Object.keys(hostKeeper.hosts).length, 3);
            when.join(
              when.promise(function(resolve) {
                hostKeeper.getHostDocs("foo.com",
                  [docs[0].titleHash,
                   docs[1].titleHash,
                   utils.computeStringHash("no such title")
                  ],
                  function (res) {
                    //  validate results here
                    should.equal(res.host, "foo.com");
                    should.equal(res.docs.length, 2);
                    resolve();
                }); // end of getHostDocs call
              }) // end of innrer promise
            ) // end of when.join
            .then(function(val) {
               done();
            });
          }); // end of readHostTable
        }); // end of insertDocuments
    }); // end of insertHosts
  }); // end of test

  it('test getHostDocsClearTitles', function(done) {
    // populate docs
    var docs = helpers.conditionDocArray(
      [
        {id: 110, host: "foo.com", title: "title 1"},
        {id: 111, host: "foo.com", title: "title 2"},
      ]);

    docHelper.insertDocuments(
      docs,
      function() {
        hostKeeper.readHostTable(function() {
          hostKeeper.getHostDocsClearTitles("foo.com", ["title 1", "title 2 - FOO.COM!"], function(results) {
            should(results.docs.length).eql(2);
            done();
          }); // end of get clear titles
        }); // end of readHostTable
      }); // end of insert docs
  }); // end of test

});

