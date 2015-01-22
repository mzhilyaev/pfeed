#!/usr/local/bin/node

var fs = require('fs');
var path = require('path');
var Getopt = require('node-getopt');


/*********** main section **********/
var getopts = new Getopt([
  ['h' , 'help',                     'display this help'],
  ['v' , 'verbous',                  'display debug info'],
  ['i' , 'inDfr=file',               'DFR to add to, if empty, new DFR created'],
  ['a' , 'addDfr=file',              'DFR to add'],
  ['s' , 'scope=hostFile:dfrFile',   'adds to scopes list'],
  ['o' , 'outDfr=file',              'adds to scopes list'],
])
.bindHelp()
.setHelp("USAGE: buildDFR.js [OPTIONS]\n" +
         "join DFR files into input DFR\n\n" +
         "[[OPTIONS]]")
.parseSystem();

function loadJSON(file) {
  var fileContent = fs.readFileSync(file, "utf8");
  return JSON.parse(fileContent);
}

function hasCommonKeys(objOne, objTwo) {
  var o1Keys = Object.keys(objOne);
  for (var i in o1Keys) {
    if (objTwo.hasOwnProperty(o1Keys[i])) return o1Keys[i];
  }
  return false;
}

function mergeObjects(objOne, objTwo) {
  Object.keys(objTwo).forEach(function(key) {
    objOne[key] = objTwo[key];
  });
}

function addScope(inDfr, hostFile, dfrFile) {
  var hosts = loadJSON(hostFile);
  var dfr = loadJSON(dfrFile);
  if (!dfr["__ANY"]) throw new Error("Error: missing __ANY section in scoped DFR " + dfrFile);
  if (!inDfr["__SCOPES"]) inDfr["__SCOPES"] = [];
  inDfr["__SCOPES"].push({
      "__HOSTS": hosts,
      "__ANY": dfr["__ANY"]
  });
}

function addDFR(inDfr, addDfr) {
  // make sure all keys are different
  if (addDfr["__ANY"]) {
    if (!inDfr["__ANY"]) {
      inDfr["__ANY"] = {};
    }
    var matchingKey = hasCommonKeys(addDfr["__ANY"], inDfr["__ANY"]);
    if (matchingKey) {
      throw new Error("Mathcing key under '__ANY' section: " + matchingKey);
    }
    mergeObjects(inDfr["__ANY"], addDfr["__ANY"]);
    // remove __ANY section from addDfr
    delete addDfr["__ANY"];
  }

  // check scopes
  if (addDfr["__SCOPES"]) {
    // simply add scopes to inDfr scopes list
    if (!inDfr["__SCOPES"]) inDfr["__SCOPES"] = [];
    inDfr["__SCOPES"] = inDfr["__SCOPES"].concat(addDfr["__SCOPES"]);
    delete addDfr["__SCOPES"];
  }

  // now add the rest of dfr
  var matchingKey = hasCommonKeys(inDfr, addDfr);
  if (matchingKey) {
    throw new Error("Mathcing key under global section: " + matchingKey);
  }
  mergeObjects(inDfr, addDfr);
}

try {
  var mainDfr = {};
  if (getopts.options.inDfr) {
    mainDfr = loadJSON(getopts.options.inDfr);
  }

  if (getopts.options.addDfr) {
    addDFR(mainDfr, loadJSON(getopts.options.addDfr));
  }

  if (getopts.options.scope) {
    var files = getopts.options.scope.split(":");
    addScope(mainDfr, files[0], files[1]);
  }

  var outDfrStr = JSON.stringify(mainDfr, null, 1);
  if (getopts.options.outDfr) {
    fs.writeFile(outputFile, outDfrStr);
  }
  else {
    console.log(outDfrStr);
  }
} catch (e) {
  console.log(e);
}


