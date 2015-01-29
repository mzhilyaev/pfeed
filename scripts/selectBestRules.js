#!/usr/local/bin/node

var mongo = require("mongoskin");
var when = require("when");
var fs = require('fs');
var path = require('path');
var Getopt = require('node-getopt');
var urlParser = require("url");
var tld = require('tldjs');
var Heap = require("heap");

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

/********** IG selection ***********/

function heapCompare(a,b) {
  return b.igCount - a.igCount;
}

function IGSelect(ruleSet, docMap, options) {
  var docs2rules = [];
  var igRuleSet = {};
  var rlist = Object.keys(ruleSet);

  // extract _DHP rules into igRuleSet - we always want to keep them
  for (var i = 0; i < rlist.length; i++) {
    var key = rlist[i];
    var ar = key.split("_");
    switch (ar[1]) {
      case "D":
      case "H":
      case "P":
        igRuleSet[key] = ruleSet[key];
        break;
    }
  }

  // for rest of the rules
  var heap = new Heap(heapCompare);
  for (var i = 0; i < rlist.length; i++) {
    var key = rlist[i];
    if (igRuleSet[key]) continue;
    // refactor rule entry
    var cats = ruleSet[key];
    var ig = {
      ruleKey: key,
      igCount: 0,
    }
    var ruleCats = Object.keys(cats);
    ruleCats.forEach(function(cat) {
      ig[cat] = {};
    });

    // walk over rule's docs and populate docs2rules & ig object
    var doclist = docMap[key];
    if (doclist) {
      for (var j = 0; j < doclist.length; j++) {
        var docId = doclist[j];
        if (!docs2rules[docId]) docs2rules[docId] = [];
        docs2rules[docId].push(ig);
      }
      ig.igCount = doclist.length * ruleCats.length;
      // ig is populated drop it into heap
      heap.push(ig);
    }
  }

  // read heap until is either empty or information gain becomes 0
  while (!heap.empty()) {
    var headItem = heap.pop();

    // check for information gain
    if (headItem.igCount == 0) break;
    // get the rule key
    var key = headItem.ruleKey;
    // and the rule to new ruleset
    igRuleSet[key] = ruleSet[key];
    // get the doclist and cats for that rule
    var doclist = docMap[key];
    var catNames = Object.keys(ruleSet[key]);

    if (options.verbous) {
      console.error("best ", headItem.ruleKey, headItem.igCount, doclist.length, JSON.stringify(ruleSet[key]));
    }
    // for every doc in the list, knock down correponding counts in its rules
    for (var j = 0; j < doclist.length; j++) {
      var docId = doclist[j];
      var docmap = docs2rules[docId];
      for (var k = 0; k < docmap.length; k++) {
        var igObj = docmap[k];
        // ignore rules already collected
        if (!igRuleSet[igObj.ruleKey]) {
          for (var z = 0; z < catNames.length; z++) {
            var cat = catNames[z];
            if (igObj[cat] && !igObj[cat][docId] ) {
              igObj.igCount--;
              igObj[cat][docId] = true;
            }
          }
        }
      }
    }
    heap.heapify();
  }

  if (!options.igLimit) return igRuleSet;

  // trim rules to the limit
  var ruleLimit = parseInt(options.igLimit);
  var sortedRules = Object.keys(igRuleSet).sort(function(a,b) {
    // always pick up domain and host rules
    if (b.match(/[HD]/)) return 1;
    if (a.match(/[HD]/)) return -1;
    if (!docMap[a]) return 1;
    if (!docMap[b]) return -1;
    return docMap[b].length - docMap[a].length;
  });

  if (sortedRules.length < ruleLimit) return igRuleSet;

  var trimmedRules = {};
  for (var i = 0; i < ruleLimit; i++) {
    trimmedRules[sortedRules[i]] = igRuleSet[sortedRules[i]];
  }
  return trimmedRules;
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
  ['m',  'igLimit=ARG',   'max number of rules to include in IG selection'],
  ['d' , 'docs=ARG',      'rules to docs map file'],
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

if (getopts.options.docs) {
  // now run IG selection
  fileContent = fs.readFileSync(getopts.options.docs, "utf8");
  var docMap = JSON.parse(fileContent);
  ruleSet = IGSelect(ruleSet, docMap, getopts.options);
}

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


