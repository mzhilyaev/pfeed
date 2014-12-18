#!/usr/local/bin/node

var when = require("when");
var LineStream = require('byline').LineStream;

var wordData = {};
var currentWord;

function outputWordData(word) {
  if(word) {
    var bestSuf;
    var bestPrec = 0;
    // sort each suffix by prec
    Object.keys(wordData).forEach(function(suf) {
      if(!suf) return;
      wordData[suf].prec = [];
      Object.keys(wordData[suf].cats).forEach(function(cat) {
        wordData[suf].prec.push([
          cat,
          wordData[suf].cats[cat],
          wordData[suf].cats[cat] / wordData[suf].count
        ]);
      });
      wordData[suf].prec.sort(function(a,b) {
        return b[1] - a[1];
      });
      wordData[suf].prec.splice(5, Number.MAX_VALUE);
      console.log(word, suf, wordData[suf].prec);
    });
  }
}

function consumeWord(line) {
  if (line.match(":")) {
    var ar = line.split(":");
    var cat = ar[1];
    var wc = ar[0].split("_");
    var suf = wc[1];
    wordData[suf].cats[cat] = (wordData[suf].cats[cat] || 0) + 1;
  }
  else {
    var wc = line.split("_");
    var word = wc[0];
    var suf = wc[1];
    if (currentWord != word) {
      outputWordData(currentWord);
      currentWord = word;
    }
    wordData[suf] = wordData[suf] || {count: 0, cats: {}};
    wordData[suf].count ++;
  }
}

function readWords(stream) {
  var lineStream = new LineStream();
  lineStream.on('data', function(line) {
    consumeWord(line.toString());
  });
  lineStream.on('end', function() {
    // execute callback when function exists
    outputWordData(currentWord);
  });
  stream.pipe(lineStream);
}

readWords(process.stdin);

