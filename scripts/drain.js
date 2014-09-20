#!/usr/local/bin/node

require("../modules/ProcHelper");
var mongo = require("mongoskin");
var http = require("http");
var xml2js = require("xml2js");
var events = require("events");
var when = require("when");
var config = require("../config/config");
var docHelper = require("../modules/DocHelper");
var hostDrainer = require("../modules/HostDrainer");
var hostSaver = require("../modules/HostSaver");

docHelper.init();
hostDrainer.init();
hostSaver.init();

hostDrainer.start();

function stop() {
  console.log("STOP");
  hostDrainer.stop(function() {
    docHelper.closeDb();
  });
}

process.on('SIGQUIT', stop);
