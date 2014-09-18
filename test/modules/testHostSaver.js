'use strict';
var should = require('should');
var when = require("when");
var helpers = require('../helpers');
var hostSaver = require('../../modules/HostSaver');
var docHelper = require('../../modules/DocHelper');

before(function(done) {
  helpers.init(done);
});

describe('test host saver', function(){
  before(function(done) {
    hostSaver.init();
    hostSaver.clear(function() {
      hostSaver.init();
      done();
    });
  });

  it('test saving', function(done) {
    hostSaver.consume({
      harvested: Math.floor(Date.now() / 1000) - 86400,
      host: "foo",
      id: 4
    });
    hostSaver.flush(new Date(Date.now() - 86400000));
    hostSaver.consume({
      harvested: Math.floor(Date.now() / 1000),
      host: "foo",
      id: 1,
    });
    hostSaver.consume({
      harvested: Math.floor(Date.now() / 1000),
      host: "foo",
      id: 2,
    });
    hostSaver.consume({
      harvested: Math.floor(Date.now() / 1000),
      host: "foo",
      id: 3,
    });
    hostSaver.flush();
    hostSaver.consume({
      harvested: Math.floor(Date.now() / 1000) - 86400,
      host: "bar",
      id: 21,
    });
    hostSaver.flush();
    // read hosts docs back in
    var docArray = [];
    hostSaver.readHostDocs("foo", function (doc) {
      if(doc == null) {
        should.equal(docArray.length, 4);
        docArray = [];
        hostSaver.readHostDocs("bar", function (doc) {
          if (doc) docArray.push(doc);
          else {
            should.equal(docArray.length, 1);
            should.equal(docArray[0].host, "bar");
            done();
          }
        });
      }
      else {
        docArray.push(doc);
      }
    });
  });

  it('host reader', function(done) {
    var hostDocReader = hostSaver.getHostDocReader("foo");
    hostDocReader.next(function(docs) {
      should.equal(docs.length, 1);
      hostDocReader.next(function(docs) {
        should.equal(docs.length, 3);
        hostDocReader.next(function(docs) {
          should.equal(docs, null);
          done();
        });
      });
    });
  });

  it('test docHelper drain', function(done) {
    docHelper.clarCollection(function() {
      docHelper.drainHostDocReader(hostSaver.getHostDocReader("foo"), function() {
        // test that the collection size is 4
        docHelper.getCollectionSize(function(size) {
          should.equal(size, 4);
          done();
        });
      });
    });
  });

  it ('subdomains', function(done) {
    hostSaver.consume({
      host: "foo.blogspot.com",
      harvested: Math.floor(Date.now() / 1000),
      id: 31,
    });
    hostSaver.consume({
      host: "foo.wordpress.com",
      harvested: Math.floor(Date.now() / 1000),
      id: 32,
    });
    hostSaver.consume({
      host: "foo.bar.livejournal.com",
      harvested: Math.floor(Date.now() / 1000),
      id: 33,
    });
    hostSaver.flush();
    when.promise(function (resolve) {
      var hostDocReader = hostSaver.getHostDocReader("foo.wordpress.com");
      hostDocReader.next(function(docs) {
        should.equal(docs[0].host, "foo.wordpress.com");
        resolve();
      });
    }).then(function() {
      hostSaver.readHostDocs("foo.wordpress.com", function (doc) {
        if (doc == null) done();
        else {
          should.equal(docs[0].host, "foo.wordpress.com");
        }
      });
    });
  });

});
