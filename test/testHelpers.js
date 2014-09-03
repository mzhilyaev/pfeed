'use strict';
var should = require('should');
var helpers = require('./helpers');

describe('test doc db helpers', function(){
  it('population', function(done) {
    helpers.populateDocs(function() {
      helpers.getCollection().find({}).count(function(err, result) {
        should.equal(result, 3);
        done();
      });
    });
  });

  it('clear', function(done) {
    helpers.populateDocs(function() {
      helpers.clearDocs(function() {
        helpers.getCollection().find({}).count(function(err, result) {
          should.equal(result, 0);
          done();
        });
      });
    });
  });

  it('repopulate', function(done) {
    helpers.repopulateDocs(function() {
      helpers.getCollection().find({}).count(function(err, result) {
        should.equal(result, 3);
        done();
      });
    });
  });
});

