#!/usr/local/bin/node

var when = require("when");
var readline = require("readline");

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
      if (wordData[suf].prec.length) {
        wordData[suf].prec.splice(5, Number.MAX_VALUE);
        console.log(word, suf, wordData[suf].count, JSON.stringify(wordData[suf].prec));
      }
    });
  }
}

function consumeWord(line) {
  if (line.match(":")) {
    var ar = line.split(/\t/);
    var arcat = ar[0].split(":");
    var cat = arcat[1];
    var wc = arcat[0].split("_");
    var suf = wc[1];
    try {
      wordData[suf].cats[cat] = parseInt(ar[1]);
    } catch (e) {
    }
  }
  else {
    var ar = line.split(/\t/);
    var wc = ar[0].split("_");
    var word = wc[0];
    var suf = wc[1];
    if (currentWord != word) {
      outputWordData(currentWord);
      currentWord = word;
      wordData = {};
    }
    wordData[suf] = {
      count: parseInt(ar[1]),
      cats: {},
    };
  }
}

function readWords(stream) {
  var rl = readline.createInterface({
    input: stream,
    output: process.stdout
  });
  rl.on('line', function(line) {
    consumeWord(line.toString());;
  });
  rl.on('close', function() {
    setTimeout(function() {
      outputWordData(currentWord);
      rl.close();
    });
  });
  rl.resume();
}

readWords(process.stdin);

