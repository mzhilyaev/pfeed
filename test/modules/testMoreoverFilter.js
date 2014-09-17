'use strict';
var should = require('should');
var xml2js = require("xml2js");
var moreover = require("../data/MoreoverStoryFilter");
var moreoverFilter = require("../../modules/MoreoverStoryFilter");


describe('test host saver', function(){
  it('parse and filter', function(done) {
    var xmlBody = moreover.moreoverXmlExample;
    xml2js.parseString(xmlBody, {explicitArray: false}, function (err, result) {
      var doc = result.articles.article[0];
      var filtered = moreoverFilter.filter(doc);
      console.log(JSON.stringify(filtered, null, 1));
      done();
    });
  });

});

