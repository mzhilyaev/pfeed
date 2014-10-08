'use strict';
var should = require('should');
var helpers = require('../helpers');
var hostTracker = require('../../modules/HostKeeper');
var docHelper = require('../../modules/DocHelper');
var hostTracker = require('../../modules/HostTracker');
var hostKeeper = require('../../modules/HostKeeper');

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

  it('test readHostTable', function(done) {
    // insert hosts
    hostTracker.insertHosts(["foo.com", "bar.com", "baz.com"], function() {
      // populate docs
      docHelper.insertDocuments([
        {id: 10, host: "foo.com"},
        {id: 20, host: "bar.com"}
      ],
      function() {
        // test the table
        should.equal(Object.keys(hostKeeper.hosts).length, 0);
        hostKeeper.readHostTable(function() {
          should.equal(Object.keys(hostKeeper.hosts).length, 3);
          done();
        });
      });
    });
  });

  it('test crowdFactor', function(done) {
    should(hostKeeper.hosts["foo.com"]).ok;
    should(hostKeeper.hosts["foo.com"].crowdFactor).not.ok;
    hostKeeper.updateCrowdFactor(function() {
      should(hostKeeper.hosts["foo.com"].croudFactor,{size:1, factor:1});
      should(hostKeeper.hosts["bar.com"].croudFactor,{size:1, factor:1});
      // insert more docs
      docHelper.insertDocuments([
          {id: 1, host: "foo.com"},
          {id: 2, host: "foo.com"},
          {id: 3, host: "foo.com"},
          {id: 4, host: "foo.com"},
          {id: 5, host: "foo.com"},
          {id: 6, host: "foo.com"},
          {id: 7, host: "foo.com"},
          {id: 8, host: "foo.com"},
          {id: 9, host: "bar.com"}
        ],
        function() {
          hostKeeper.updateCrowdFactor(function() {
            should(hostKeeper.hosts["foo.com"].croudFactor,{size:9, factor:4});
            should(hostKeeper.hosts["bar.com"].croudFactor,{size:2, factor:1});
            var fooData = hostKeeper.getHostInfo("foo.com");
            should(fooData).eql({"foo.com":{"host":"foo.com","crowdFactor":{"size":9,"factor":4}}});
            var fooBarData = hostKeeper.getHostInfo(["foo.com", "bar.com"]);
            should(fooBarData).eql({"foo.com":{"host":"foo.com","crowdFactor":{"size":9,"factor":4}},
                                    "bar.com":{"host":"bar.com","crowdFactor":{"size":2,"factor":1}}});
            done();
          });
        }
      );
    });
  });
});
