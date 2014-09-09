'use strict';
var app = require('../../webapp/app');
var http = require('http');
var request = require('supertest');
var should = require('should');
var helpers = require('../helpers');
var hostTracker = require('../../modules/HostTracker');
var hostKeeper = require('../../modules/HostKeeper');
var docHelper = require('../../modules/DocHelper');

before(function(done) {
  helpers.init(done);
});

describe('route /hosts/topdomains', function(){
  before(function(done) {
    helpers.clearHosts(function() {
      hostKeeper.refresh(done);
    });
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
        hostKeeper.refresh(function() {
          done();
        });
       });
    });
  });

  it('get top host info', function(done) {
    docHelper.clarCollection(function() {
      docHelper.insertDocuments([
        {id: 1, host: "foo.com", urlHash: 1},
        {id: 2, host: "foo.com", urlHash: 2},
        {id: 3, host: "foo.com", urlHash: 3},
        {id: 4, host: "bar.com", urlHash: 3},
        ],
        function() {
          hostKeeper.refresh(function() {
            request(app)
            .post("/hosts/tophosts/info")
            .send(["foo.com", "bar.com"])
            .expect(200)
            .end(function(err, res) {
              should.not.exist(err);
              var hostInfo = JSON.parse(res.text);
              should(hostInfo["foo.com"].crowdFactor).eql({"size":3,"factor":2});
              should(hostInfo["bar.com"].crowdFactor).eql({"size":1,"factor":1});
              done();
            });
          });
        }
      );
    });
  });

  it('get top host historical docs', function(done) {
    request(app)
    .post("/hosts/tophosts/history")
    .send({
      host: "foo.com",
      hashes: [1,2],
    })
    .expect(200)
    .end(function(err, res) {
      should.not.exist(err);
      var payload = JSON.parse(res.text);
      should(payload.docs.length).equal(2);
      done();
    });
  });
});


