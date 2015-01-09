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

function accumulate(url, title, topics, urlHash) {
  url = url.toLowerCase();
  title = title.toLowerCase();
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
  var terms = {};

  function addToTerms(data, suffix, doBigrams) {
    var lastTerm;
    var tokens = data;  // assume data is array of tokens
    if (typeof(data) == "string") {
      // data is string, hence tokenize it
      tokens = data.toLowerCase().replace(kNotWordPattern, " ").split(/\s+/);
    }
    // walk tokens and fill in terms object
    tokens.forEach(function(term) {
      if (term.match(/[a-z]/) && !stopWords[term] && term.length > 2 && term.length < 20) {
        terms[term+suffix] = true;
        if (lastTerm && doBigrams) {
          terms[lastTerm + "+" + term + suffix] = true;
        }
        lastTerm = term;
      }
    });
  }

  function unconditionalAddToTerms(tokens, suffix) {
    tokens.forEach(function(term) {
      terms[term+suffix] = true;
    });
  }

  function processUrl(url) {
    var urlObj = require("url").parse(url);
    var host = urlObj.hostname;
    var domain = require('tldjs').getDomain(host);

    // do host first
    host = host.replace(/^www\./,"");  // no www
    host = host.replace(/^rss\./,"");  // no rss
    host = host.substring(0, host.length - domain.length); // no domain string
    // explicitly tokenize host string on period, keep all other punctuation
    // add tokens on period bounaries, no bigrams
    var hostChunks = host.split(".");
    addToTerms(hostChunks, "_U", false);

    // add domain
    unconditionalAddToTerms([domain], "_D", false);

    // add host rules
    var hostStr = domain;
    hostChunks.reverse().forEach(function(chunk) {
      if (chunk && chunk != "") {
        hostStr = chunk + "." + hostStr;
        unconditionalAddToTerms([hostStr], "_H", false);
      }
    });

    // deal with paths
    var pathChunks = urlObj.pathname.split("/");
    // remove chunks that are too long (> 30), or have too many [-_] in them
    for (var i in pathChunks) {
      var chunk = pathChunks[i];
      if (chunk == "" ||
          chunk.length > 30 ||
          chunk.split(/[-_]/).length > 3) {
          pathChunks[i] = null;
      }
      else {
        // it's an OK chunk, so generate _U and _P terms
        unconditionalAddToTerms([domain + "/" + chunk], "_P", false);
        addToTerms(chunk, "_U", true);
      }
    }
  }

  function outputTerms() {
    Object.keys(terms).forEach(function(term) {
      console.log(term + "," + urlHash);
      catNames.forEach(function(cat) {
        console.log(term + ":" + cat + "," + urlHash);
      });
    });
  }

  function outputCats() {
    catNames.forEach(function(term) {
      console.log(term + "_C," + urlHash);
    });
  }

  // if categorization is assgined, process terms
  if (catNames.length > 0) {
    processUrl(url);
    addToTerms(title, "_T", true);
    outputTerms();
    outputCats();
    // store assigned classification
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
