#!/usr/local/bin/node

var mongo = require("mongoskin");
var http = require("http");
var xml2js = require("xml2js");
var events = require("events");
var when = require("when");
var config = require("../config/config");
var download = require("../modules/Download");
var moreoverFilter = require("../modules/MoreoverStoryFilter");
var docHelper = require("../modules/DocHelper");
var hostSaver = require("../modules/HostSaver");
var hostKeeper = require("../modules/HostKeeper");

download.init();
docHelper.init();
hostSaver.init();
hostKeeper.init();

download.on("saved-file", function(filePath) {
  console.log(filePath + " saved");
});

download.on("json", function(json) {
  if (json.response.articles
      && json.response.articles instanceof Object
      && json.response.articles.article instanceof Array) {
    // turn donwload off, to avoid interference
    download.setSkipFlag(true);
    // filter out non-english and blogs docs
    var dbDocs = [];
    json.response.articles.article.forEach(function(doc) {
      var filtered = moreoverFilter.filter(doc);
      if (filtered) {
        if (hostKeeper.isListed(filtered.host)) {
          console.log("---> " + filtered.host);
          dbDocs.push(filtered);
        }
        hostSaver.consume(filtered);
      }
    });

    // flush all hosts data to disk - it is syncronized
    hostSaver.flush();
    if (dbDocs.length > 0) {
      docHelper.insertDocuments(dbDocs, function() {
        // after all insertions are done, set skip falg to false
        console.log("inserted " + dbDocs.length + " docs");
        download.setSkipFlag(false);
        doBookkeeping();
      });
    }
    else {
      doBookkeeping();
    }
  }
});

function doBookkeeping() {
  console.log("Done with flush and db writes");
  // not sure if reading host is needed every 30 seconds... but ok for now
  hostKeeper.downloadRefresh(function() {
    console.log("Refresh complete");
    download.setSkipFlag(false);
  });
};


