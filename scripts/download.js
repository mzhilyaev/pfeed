#!/usr/local/bin/node

var mongo = require("mongoskin");
var http = require("http");
var xml2js = require("xml2js");
var events = require("events");
var config = require("../config/config");
var download = require("../modules/Download");
var moreoverFilter = require("../modules/MoreoverStoryFilter");
var docHelper = require("../modules/DocHelper");

download.init();
docHelper.init();

download.on("saved-file", function(filePath) {
  console.log(filePath + " saved");
});

download.on("json", function(json) {
  if (json.response.articles
      && json.response.articles instanceof Object
      && json.response.articles.article instanceof Array) {
        // filter out non-english and blogs docs
        var filteredDocs = [];
        json.response.articles.article.forEach(function(doc) {
          var filtered = moreoverFilter.filter(doc);
          if (filtered) {
            filteredDocs.push(filtered);
          }
        });

        if (filteredDocs.length > 0) {
          // skip donwload if database is too busy
          download.setSkipFlag(true);
          docHelper.insertDocuments(filteredDocs, function() {
            console.log("inserted " + filteredDocs.length + " docs");
            // after all insertions are done, set skip falg to false
            download.setSkipFlag(false);
          });
        }
  }
});


