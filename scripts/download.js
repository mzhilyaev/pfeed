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

download.init();
docHelper.init();
hostSaver.init();

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
            hostSaver.consume(filtered);
          }
        });

        if (filteredDocs.length > 0) {
          // wait until hosts are flushed and docs are inserted
          when.join(
            // flush all hosts data to disk
            when.promise(function(resolve) {
              hostSaver.flush(resolve);
            }),
            // skip donwload if database is too busy
            when.promise(function(resolve) {
              download.setSkipFlag(true);
              docHelper.insertDocuments(filteredDocs, function() {
                // after all insertions are done, set skip falg to false
                console.log("inserted " + filteredDocs.length + " docs");
                download.setSkipFlag(false);
                resolve();
              });
            })
          ).then(function() {
            doBookkeeping();
          });
        }
        else {
          doBookkeeping();
        }
  }
});

function doBookkeeping() {
};


