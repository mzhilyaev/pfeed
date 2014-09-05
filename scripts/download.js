#!/usr/local/bin/node

var mongo = require("mongoskin");
var http = require("http");
var xml2js = require("xml2js");
var events = require("events");
var config = require("../config/config");
var download = require("../modules/Download");
var moreoverFilter = require("../modules/MoreoverStoryFilter");
var docHelper = require("../modules/DocHelper");
var hostKeeper = require("../modules/HostKeeper");

download.init();
docHelper.init();
hostKeeper.init();

download.on("saved-file", function(filePath) {
  console.log(filePath + " saved");
});

download.on("json", function(json) {
  if (json.response.articles && json.response.articles instanceof Object) {
    console.log(json.response.articles.article.length);
    json.response.articles.article.forEach(function(doc) {
      var filtered = moreoverFilter.filter(doc);
      if (filtered) {
        hostKeeper.appendUrlHash(doc);
        docHelper.addDocument(filtered);
      }
    });
  }
});


