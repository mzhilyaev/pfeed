#!/usr/local/bin/node

var mongo = require("mongoskin");
var when = require("when");
var fs = require('fs');
var Getopt = require('node-getopt');
var config = require("../config/config");
var RevMap = require("../refData/IAB").RevMap;
var MoreoverMap = require("../refData/moreover_to_IAB").MoreoverToIABMap;
var stopWords = require('../modules/StopWords').StopWords;
var StatsUtils = require('../stats/StatsUtils');

var stats = {};
const kNotWordPattern = /[^a-zA-Z0-9 ]+/g;

function addToStats(key, cats) {
  if(!stats[key]) {
    stats[key] = {
      count: 0,
      cats: {},
    };
  }
  stats[key].count++;
  cats.forEach(function(cat) {
    stats[key].cats[cat] = (stats[key].cats[cat] || 0) + 1;
  });
};

function accumulate(url, title, topics) {
  // compute IAB cats
  var cats = {};
  topics.forEach(function(topic) {
    var cat = MoreoverMap[topic];
    if (cat && RevMap[cat]) {
      RevMap[cat].forEach(function(name) {
        cats[name] = true;
      });
    }
  });

  var catNames = Object.keys(cats);

  function outputTerms(text, suffix) {
    var terms = {};
    var lastTerm;
    text.toLowerCase().replace(kNotWordPattern, " ").split(/\s+/).forEach(function(term) {
      if (term.match(/[a-z]/) && !stopWords[term] && term.length > 2 && term.length < 20) {
        terms[term+suffix] = true;
        if (lastTerm) {
          terms[lastTerm+term+suffix] = true;
        }
        lastTerm = term;
      }
    });

    //console.log(url, title, JSON.stringify(Object.keys(terms)));
    Object.keys(terms).forEach(function(term) {
      console.log(term);
      catNames.forEach(function(cat) {
        console.log(term + ":" + cat);
      });
    });
  }

  if (catNames.length > 0) {
    outputTerms(url, "_U");
    outputTerms(title, "_T");
    outputTerms(url + " " + title, "_A");
    addToStats("_ANY", catNames);
  }
};

function finalize() {
  fs.writeFile('cat.stats', JSON.stringify(stats));
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
.setHelp("USAGE: generateCorpusStats.js [OPTIONS]\n" +
         "Generates Corpus URL and Title stats\n\n" +
         "[[OPTIONS]]")
.parseSystem();

StatsUtils.runSearch(getopts.options, accumulate, finalize);
