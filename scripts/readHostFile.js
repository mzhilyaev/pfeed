#!/usr/local/bin/node

var mongo = require("mongoskin");
var http = require("http");
var xml2js = require("xml2js");
var events = require("events");
var when = require("when");
var hostSaver = require("../modules/HostSaver");

hostSaver.init();

hostSaver.readHostDocs(process.argv[2], function(doc) {
  if (doc) {
    console.log(JSON.stringify(doc, null, 1));
    console.log("\n\n==================\n\n");
  }
});




