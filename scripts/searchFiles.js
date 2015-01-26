#!/usr/local/bin/node

var mongo = require("mongoskin");
var when = require("when");
var fs = require('fs');
var path = require("path");
var Getopt = require('node-getopt');
var config = require("../config/config");
var RevMap = require("../refData/IAB").RevMap;
var MoreoverMap = require("../refData/moreover_to_IAB").MoreoverToIABMap;
var stopWords = require('../modules/StopWords').StopWords;
var HostDocReader = require("../modules/HostDocReader");

var profiledCats = {
  "personal finance": true,
  "personal finance/stocks": true,
  "business": true,
};

function processDoc(doc, collector) {
  collector.count++;
  var topics = doc.topics;

  if (!topics) return;

  var cats = {};
  topics.forEach(function(topic) {
    var cat = MoreoverMap[topic];
    if (cat && RevMap[cat]) {
      RevMap[cat].forEach(function(name) {
        cats[name] = true;
      });
    }
  });
  Object.keys(cats).forEach(function(cat) {
    if (profiledCats[cat]) {
      collector.cats[cat] ++;
    }
  });
}

function processDocs(docs, collector) {
  for (var i in docs) {
    processDoc(docs[i], collector);
  }
}

function processSingleDir(dir, topDir, cb) {
  if (config.useSubdomains[dir]) {
    setTimeout(cb);
    return;
  }
  var hostReader = new HostDocReader(path.join(topDir, dir));
  var collector = {
    DIR: dir,
    count: 0,
    cats: {},
    terms: {},
  };
  Object.keys(profiledCats).forEach(function (cat) {
    collector.cats[cat] = 0;
  });
  
  function outputCollector() {
    console.log(JSON.stringify(collector));
  }

  function readNextFile() {
     hostReader.next(function (docs) {
       if (docs) {
         processDocs(docs, collector);
         setTimeout(readNextFile);
       }
       else {
         outputCollector();
         setTimeout(cb);
       }
     });
  }
  readNextFile();
}

function processDirectory(dir) {
  var subDirs = fs.readdirSync(dir);
  function doNextDir() {
    var nextDir = subDirs.shift();
    if (nextDir) {
      processSingleDir(nextDir, dir, function() {
        setTimeout(doNextDir, 0);
      });
    }
  }
  doNextDir();
}

/*********** main section **********/
var getopts = new Getopt([
  ['h' , 'help',          'display this help'],
  ['v' , 'verbous',       'display debug info'],
  ['d' , 'dir=ARG',       'directory to start from'],
])
.bindHelp()
.setHelp("USAGE: searchFiles.js [OPTIONS]\n" +
         "processes host files and looks for patterns\n\n" +
         "[[OPTIONS]]")
.parseSystem();

processDirectory(getopts.options.dir);
