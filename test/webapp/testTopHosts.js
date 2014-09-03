'use strict';
var app = require('../../webapp/app');
var http = require('http');
var request = require('supertest');
var should = require('should');
var helpers = require('../helpers');
var hostTracker = require('../../modules/HostTracker');


describe('route /hosts/topdomains', function(){
  before(function(done) {
    helpers.clearHosts(done);
  });

  it('report two hosts', function(done){
    request(app)
    .post("/hosts/tophosts")
    .send(["foo.com", "bar.com"])
    .expect(200)
    .end(function (err, res) {
       should.not.exist(err);
       hostTracker.getCollectionSize(function(size) {
        should.equal(size,2);
        done();
       });
    });
  });

  it('report intersecting hosts', function(done) {
    request(app)
    .post("/hosts/tophosts")
    .send(["foo.com", "foobar.com"])
    .expect(200)
    .end(function (err, res) {
       should.not.exist(err);
       hostTracker.getCollectionSize(function(size) {
        should.equal(size,3);
        done();
       });
    });
  });
});


