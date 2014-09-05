'use strict';
var should = require('should');
var helpers = require('../helpers');
var hostTracker = require('../../modules/HostTracker');

before(function(done) {
  helpers.init(done);
});

describe('test host tracker', function(){
  before(function(done) {
    hostTracker.clarCollection(done);
  });

  it('insert one host', function(done) {
    hostTracker.insertHosts("foo.com", function() {
      // we should only see 1 record
      hostTracker.getCollectionSize(function(size) {
        should.equal(size,1);
        // attempt to insert same host again
        hostTracker.insertHosts("foo.com", function() {
          hostTracker.getCollectionSize(function(size) {
            should.equal(size,1);
            done();
          });
        });
      });
    });
  });

  // test multiple hosts
  it('insert two hosts - skiping existing one', function(done) {
    hostTracker.insertHosts(["foo.com", "bar.com", "baz.com"], function() {
      hostTracker.getCollectionSize(function(size) {
        should.equal(size,3);
        done();
      });
    });
  });

});

