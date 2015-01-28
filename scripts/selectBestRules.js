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

function bruteForceRuleSelect(rules, options) {
  var ruleSet = {};
  var precLevel = (options.prec) ? parseFloat(options.prec) : 0.9;
  var ruleLimit = (options.limit) ? parseInt(options.limit) : 1000000000;

  // check for suffix exclusion
  var exldSuffixes = {};
  if (options.xld) {
    options.xld.split("").forEach(function(suffix) {
      exldSuffixes[suffix] = true;
    });
  }

  // order rules by ALL count
  var orderKeys = Object.keys(rules).sort(function(a,b) {
    if (rules[b]['ALL'] > rules[a]['ALL']) return 1;
    if (rules[b]['ALL'] < rules[a]['ALL']) return -1;
    // same count, return the shortest key
    return a.length - b.length;
  });

  // now walk the list and only choose rules with high enough precision
  var rulesAdded = 0;
  for (var i = 0; i < orderKeys.length; i++) {
    var key = orderKeys[i];
    var res = {};
    var cats = rules[key];
    var total = cats['ALL'];
    Object.keys(cats).forEach(function(cat) {
      var prec = cats[cat] / total;
      if (cat != 'ALL' && prec > precLevel) {
        if (!res[cat] || res[cat] < Math.round(prec*100)) {
          res[cat] = Math.round(prec*100);
        }
      }
    });
    if (Object.keys(res).length > 0 && validateRule(key, res, ruleSet, exldSuffixes)) {
      if (options.verbous) {
        console.error(key, total, JSON.stringify(res));
      }
      ruleSet[key] = res;
      rulesAdded++;
      if (rulesAdded > ruleLimit) break;
    }
  }
  return ruleSet;
}

function areCovered(testCats, coveringCats) {
  if (coveringCats == null) return false;
  for (var cat in testCats) {
    var coveredPrec = coveringCats[cat];
    if (coveredPrec == null) return false; // no corresponding cat covering
    // otherwise test precision diffs, should be more then coveredPrec
    if (testCats[cat] > (coveredPrec*1.05)) return false;
  }
  return true;
}

function vlaidateHostRule(host, cats, ruleSet) {
  var domain  = tld.getDomain(host);
  return !areCovered(cats, ruleSet[domain + "_D"]);
}

function vlaidatePathRule(key, cats, ruleSet) {
  var ar = key.split("/");
  var domain  = tld.getDomain(ar[0]);
  return !areCovered(cats, ruleSet[domain + "_D"]);
}

function vlaidateURule(term, cats, ruleSet) {
  // check for bigrams covered by single terms
  if (term.indexOf("+") != -1) {
    var ar = term.split("+");
    return !areCovered(cats, ruleSet[ar[0] + "_U"]) ||
           !areCovered(cats, ruleSet[ar[1] + "_U"]);
  }
  return true;
}

function vlaidateTRule(term, cats, ruleSet) {
  // check for bigrams covered by single terms
  if (term.indexOf("+") != -1) {
    var ar = term.split("+");
    return !areCovered(cats, ruleSet[ar[0] + "_T"]) ||
           !areCovered(cats, ruleSet[ar[1] + "_T"]);
  }
  return true;
}

// returns false if the rule is invalid
// for example, if it's covered by a stronger rule
function validateRule(key, cats, ruleSet, exldSuffixes) {
  var ar = key.split("_");
  // ignore the rule if suffix is excluded
  if (exldSuffixes[ar[1]]) return false;
  // now test a rule
  switch (ar[1]) {
    case "H":
      return vlaidateHostRule(ar[0], cats, ruleSet);
      break;
    case "P":
      return vlaidatePathRule(ar[0], cats, ruleSet);
      break;
    case "U":
      return vlaidateURule(ar[0], cats, ruleSet);
      break;
    case "T":
      return vlaidateTRule(ar[0], cats, ruleSet);
      break;
  }
  return true;
}

function addDomain(domain, cats, dfrObject) {
  if (!dfrObject[domain]) {
    dfrObject[domain] = {};
  }
  dfrObject[domain]["__ANY"] = cats;
}

function addHost(host, cats, dfrObject) {
  var domain  = tld.getDomain(host);
  if (!dfrObject[domain]) {
    dfrObject[domain] = {};
  }
  var subs = host.substring(0, host.length - domain.length);
  var key = subs.replace(".",". ").replace(/ $/,"");
  dfrObject[domain][key] = cats;
}

function addPath(key, cats, dfrObject) {
  var ar = key.split("/");
  var domain = ar[0];
  var path = ar[1];
  if (!dfrObject[domain]) {
    dfrObject[domain] = {};
  }
  dfrObject[domain]["/" + path] = cats;
}

function addURule(key, cats, dfrObject) {
  if (!dfrObject["__ANY"]) {
    dfrObject["__ANY"] = {};
  }
  if (key.indexOf("+") != -1) {
    key = key.replace("+", "");
  }
  dfrObject["__ANY"][key + "_u"] = cats;
}

function addTRule(key, cats, dfrObject) {
  if (!dfrObject["__ANY"]) {
    dfrObject["__ANY"] = {};
  }
  if (key.indexOf("+") != -1) {
    key = key.replace("+", "");
  }
  dfrObject["__ANY"][key + "_t"] = cats;
}

function generateDfrForRule(key, cats, dfrObject, suffixList) {
  var ar = key.split("_");
  // check if the suffix is in the suffix list
  if (suffixList && suffixList.indexOf(ar[1]) == -1) return;
  switch (ar[1]) {
    case "D":
      addDomain(ar[0], cats, dfrObject);
      break;
    case "H":
      addHost(ar[0], cats, dfrObject);
      break;
    case "P":
      addPath(ar[0], cats, dfrObject);
      break;
    case "U":
      addURule(ar[0], cats, dfrObject);
      break;
    case "T":
      addTRule(ar[0], cats, dfrObject);
      break;
  }
}

function generateDFR(rules, dfrObject, suffixList) {
  Object.keys(rules).forEach(function(key) {
    generateDfrForRule(key, Object.keys(rules[key]), dfrObject, suffixList);
  });
}

function outputDFR(dfrObject, outputFile) {
  if (outputFile) {
    fs.writeFile(outputFile, JSON.stringify(dfrObject));
  } else {
    console.log(JSON.stringify(dfrObject));
  }
}

/*********** main section **********/
var getopts = new Getopt([
  ['h' , 'help',          'display this help'],
  ['c' , 'cats=ARG',      'cat stats file'],
  ['p' , 'prec=ARG',      'precision limit: default=0.9'],
  ['v' , 'verbous',       'show debug output'],
  ['l' , 'limit=ARG',     'number of rules to include'],
  ['x' , 'xld=ARG',       'exlude suffixes'],
  ['s' , 'split',         'split DFRs into rules, ulr, and title files'],
  ['g' , 'gen',           'generate DFR'],
])
.bindHelp()
.setHelp("USAGE: selectBestRules.js [OPTIONS] RULES_FILE\n" +
         "Selects Best Rules from rules.json file\n\n" +
         "[[OPTIONS]]")
.parseSystem();

// read rules
var fileContent = fs.readFileSync(getopts.argv[0], "utf8");
var ruleCounts = JSON.parse(fileContent);

var ruleSet = bruteForceRuleSelect(ruleCounts, getopts.options);

if (getopts.options.gen) {
  var dfr = {};
  if (getopts.options.split) {
    generateDFR(ruleSet, dfr, "DHP");
    outputDFR(dfr,"hostRules.dfr")
    dfr = {};
    generateDFR(ruleSet, dfr, "U");
    outputDFR(dfr,"urlTerms.dfr")
    dfr = {};
    generateDFR(ruleSet, dfr, "T");
    outputDFR(dfr,"titleTerms.dfr")
  }
  else {
    generateDFR(ruleSet, dfr);
    outputDFR(dfr);
  }
}


