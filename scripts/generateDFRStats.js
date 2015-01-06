#!/usr/local/bin/node

var mongo = require("mongoskin");
var when = require("when");
var fs = require('fs');
var path = require('path');
var Getopt = require('node-getopt');
var urlParser = require("url");
var tld = require('tldjs');

var config = require("../config/config");
var RevMap = require("../refData/IAB").RevMap;
var MoreoverMap = require("../refData/moreover_to_IAB").MoreoverToIABMap;
var stopWords = require('../modules/StopWords').StopWords;
var DFRClassifier = require('../stats/DFRClassifier');
var StatsCollector = require('../stats/StatsCollector');
var StatsUtils = require('../stats/StatsUtils');

var classifiers = [];
var statsCollector = new StatsCollector();

function processOneDocument(url, title, topics) {
  // map Moreover topcis to IAB cats
  var cats = {};
  topics.forEach(function(topic) {
    var cat = MoreoverMap[topic];
    if (cat && RevMap[cat]) {
      RevMap[cat].forEach(function(name) {
        cats[name] = true;
      });
    }
  });
  // catNames represent IAB categories
  var expectedCats = Object.keys(cats);

  var urlObj = urlParser.parse(url);
  var domain = tld.getDomain(urlObj.hostname);

  // classify for rulesets
  //console.log(url, title, expectedCats);
  var allResults = [];
  classifiers.forEach(function(classifier) {
    var results = classifier.classify(url, title);
    //console.log(classifier.name, results);
    statsCollector.add(domain, classifier.name, expectedCats, results);
    allResults = allResults.concat(results);
  });

  // add all interests to stats
  statsCollector.add(domain, "ALL", expectedCats, allResults);
}

/*********** main section **********/
var getopts = new Getopt([
  ['h' , 'help',          'display this help'],
  ['d' , 'dbHost=ARG',    'db hosts: default=localhost'],
  ['p' , 'dbPort=ARG',    'db port: default=27017'],
  ['f' , 'fromDate=ARG',  'starting from date in yyyy/mm/dd format (like 2014/10/01): default none'],
  ['t' , 'toDate=ARG',    'ending from date in yyyy/mm/dd format (like 2014/10/01): default none'],
  ['l' , 'limit=ARG',     'docs limit: default none'],
])
.bindHelp()
.setHelp("USAGE: generateDFRStats.js [OPTIONS] [DFR FILES]\n" +
         "Generates DFR matching stats\n\n" +
         "[[OPTIONS]]")
.parseSystem();

// read DFRs  
for (var i in getopts.argv) {
 var fileContent = fs.readFileSync(getopts.argv[i], "utf8");
 var jsonObj = JSON.parse(fileContent);
 var fileName = path.basename(getopts.argv[i], ".json");
 classifiers.push(new DFRClassifier(jsonObj, fileName));
}

StatsUtils.runSearch(getopts.options, processOneDocument, function() {statsCollector.output();});

