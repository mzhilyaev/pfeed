var crypto = require('crypto');
var tld = require('tldjs');
var stem = require('stem-porter')
var stopWords = require('./StopWords').StopWords;
var utils = require('./Utils');
var config = require('../config/config');

const kNotWordPattern = /[^a-zA-Z0-9 ]+/g;

var TermAnnotator = {

  getProperNouns: function(text) {
    var names = {};
    var rawWords = text.replace(kNotWordPattern, " ").split(/\s+/);
    rawWords.forEach(function(word) {
      if (word.match(/^[A-Z]/) != null) {
        names[word] = true;
      }
    });
    return names;
  },

  textToWords: function(text, wordArray, stemArray, names) {
    if (!text) return;
    var rawWords = text.replace(kNotWordPattern, " ").split(/\s+/);
    rawWords.forEach(function(word) {
      if (word.length > 1 && word.match(/^[0-9]+$/) == null) {
        // test if we need to lowcase
        if (word.match(/^[A-Z][A-Z0-9]+$/)) {
          // all caps
          wordArray.push(word);
          stemArray.push(word);
        } else if (word.match(/^[A-Z]/) && names[word]) {
          // first letter capitalized and in the names dictionary
          wordArray.push(word);
          stemArray.push(word);
        } else if (!stopWords[word.toLowerCase()]){
          // lowcase
          wordArray.push(word.toLowerCase());
          stemArray.push(stem(word.toLowerCase()));
        }
      }
    });
  },

  getWordArray: function(doc, obj, names) {
    obj.words = [];
    obj.stems = [];
    this.textToWords(doc.title, obj.words, obj.stems, names);
    this.textToWords(doc.content, obj.words, obj.stems, names);
  },

  annotate: function(doc) {
    var words = [];
    var stems = [];
    var names = [];
    if (doc.semantics) {
      names = this.getProperNouns(doc.semantics.join(" "));
    }
    this.textToWords(doc.title, words, stems, names);
    words.push("__TE__");
    this.textToWords(doc.content, words, stems, names);
    if (words.length == 1) {
     // empty doc
     words = [];
    }
    doc.words = words;
  },
};

module.exports = TermAnnotator;
