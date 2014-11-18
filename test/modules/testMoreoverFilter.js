'use strict';
var should = require('should');
var xml2js = require("xml2js");
var moreover = require("../data/MoreoverStoryFilter");
var moreoverFilter = require("../../modules/MoreoverStoryFilter");
var utils = require("../../modules/Utils");


describe('test host saver', function(){
  it('parse and filter', function(done) {
    var xmlBody = moreover.moreoverXmlExample;
    xml2js.parseString(xmlBody, {explicitArray: false}, function (err, result) {
      var doc = result.articles.article[0];
      var filtered = moreoverFilter.filter(doc);
      //console.log(JSON.stringify(filtered, null, 1));
      should.ok(filtered.iab.length > 0);
      done();
    });
  });

  it('parse subdomains', function() {
    var filtered = moreoverFilter.filter({originalUrl: "http://foo.wordpress.com/xyz", source: {}});
    should.equal(filtered.host, "foo.wordpress.com");
    var filtered = moreoverFilter.filter({originalUrl: "http://foo.bar.com/xyz", source: {}});
    should.equal(filtered.host, "bar.com");
  });

  it('generate title hashes', function() {
    var filtered = moreoverFilter.filter({originalUrl: "http://foo.wordpress.com/xyz", source: {}, title: "XYZ: Hello - Wordpress!"});
    should(filtered.titleHash).eql([
      utils.computeStringHash("XYZ: Hello"),
      utils.computeStringHash("XYZ: Hello - Wordpress!"),
      utils.computeStringHash("Hello"),
    ]);
  });
});

