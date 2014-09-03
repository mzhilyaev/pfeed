'use strict';
var app = require('../../webapp/app');
var http = require('http');
var request = require('supertest');
var should = require('should');
var helpers = require('../helpers');


describe('route /hosts/recentdocs', function(){
  before(function(done) {
    helpers.repopulateDocs(function() {
      helpers.getCollection().find({}).count(function(err, result) {
          done();
        });
    });
  });

  it('must find two hits', function(done){
    request(app)
    .get("/hosts/recentdocs/foo.com")
    .expect(200)
    .end(function (err, res) {
       should.not.exist(err);
       var docs = JSON.parse(res.text);
       should.equal(docs.length, 2);
       done();
    });
  });

  it('must find one hits', function(done){
    request(app)
    .get("/hosts/recentdocs/bar.com")
    .expect(200)
    .end(function (err, res) {
       should.not.exist(err);
       var docs = JSON.parse(res.text);
       should.equal(docs.length, 1);
       done();
    });
  });

  it('empty results', function(done){
    request(app)
    .get("/hosts/recentdocs/foobar.com")
    .expect(200)
    .end(function (err, res) {
       should.not.exist(err);
       var docs = JSON.parse(res.text);
       should.equal(docs.length, 0);
       done();
    });
  });

  it('host list post', function(done){
    request(app)
    .post("/hosts/recentdocs")
    .send({hosts: ["foo.com", "bar.com"]})
    .expect(200)
    .end(function (err, res) {
       should.not.exist(err);
       var docs = JSON.parse(res.text);
       should.equal(docs.length, 3);
       done();
    });
  });

  it ('get seconds ago', function(done) {
    request(app)
    .get("/hosts/recentdocs/foo.com/3600")
    .expect(200)
    .end(function (err, res) {
       should.not.exist(err);
       var docs = JSON.parse(res.text);
       should.equal(docs.length, 1);
       done();
    });
  });

  it('post seconds ago', function(done){
    request(app)
    .post("/hosts/recentdocs")
    .send({hosts: ["foo.com"], seconds: 3600})
    .expect(200)
    .end(function (err, res) {
       should.not.exist(err);
       var docs = JSON.parse(res.text);
       should.equal(docs.length, 1);
       done();
    });
  });
});


