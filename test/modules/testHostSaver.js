'use strict';
var should = require('should');
var helpers = require('../helpers');
var hostSaver = require('../../modules/HostSaver');

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
      harvested: Math.floor(Date.now() / 1000),
      host: "foo",
      c: 1,
    });
    hostSaver.consume({
      harvested: Math.floor(Date.now() / 1000),
      host: "foo",
      c: 2,
    });
    hostSaver.consume({
      harvested: Math.floor(Date.now() / 1000),
      host: "foo",
      c: 3,
    });
    hostSaver.consume({
      harvested: Math.floor(Date.now() / 1000) - 86400,
      host: "foo",
      c: 4
    });
    hostSaver.consume({
      harvested: Math.floor(Date.now() / 1000) - 86400,
      host: "bar",
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

});

