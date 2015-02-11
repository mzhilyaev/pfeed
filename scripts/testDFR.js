#!/usr/local/bin/node

var fs = require('fs');
var path = require('path');
var Getopt = require('node-getopt');
var LineStream = require('byline').LineStream;

var DFRClassifier = require('../stats/DFRClassifier');
var classifier = null;

function readLines() {
  var lineStream = new LineStream();
  lineStream.on('data', function(line) {
    try {
      var str = line.toString();
      var chunks = str.split(/\t/);
      console.log(chunks);
      var results = classifier.classify(chunks[0], chunks[1]);
      console.log(">>> ", results);
    } 
    catch (e) {
      console.error("ERROR " + e);
    }
  });
  lineStream.on('end', function() {
    //setTimeout();
  });
  process.stdin.pipe(lineStream);
}

/*********** main section **********/
var getopts = new Getopt([
  ['h' , 'help',          'display this help'],
  ['v' , 'verbous',       'display debug info'],
])
.bindHelp()
.setHelp("USAGE: testDFR.js [OPTIONS] [DFR FILE]\n" +
         "eds url and title from stdin and classifies them\n\n" +
         "[[OPTIONS]]")
.parseSystem();

// read DFRs  
var fileContent = fs.readFileSync(getopts.argv[0], "utf8");
var jsonObj = JSON.parse(fileContent);
var fileName = path.basename(getopts.argv[0], ".json");
classifier = new DFRClassifier(jsonObj, fileName);

readLines();
