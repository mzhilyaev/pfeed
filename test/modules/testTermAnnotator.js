'use strict';
var should = require('should');
var xml2js = require("xml2js");
var doc = require("../data/TestAnnotator").testDoc;
var termAnnotator = require("../../modules/TermAnnotator");


describe('test annotator', function(){
  it('annotate', function(done) {
    termAnnotator.annotate(doc);
    console.log(JSON.stringify(doc, null, 1));
    done();
  });

});

