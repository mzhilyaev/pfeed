var crypto = require('crypto');
var tld = require('tldjs');
var stem = require('stem-porter')
var stopWords = require('./StopWords').StopWords;
var utils = require('./Utils');
var config = require('../config/config');

const kNotWordPattern = /[^a-zA-Z0-9 ]+/g;

var MoreoverStoryFilter = {

  getTags: function(doc, obj) {
    if (doc.tags && doc.tags instanceof Object && doc.tags.tag instanceof Array) {
      obj.tags = [];
      doc.tags.tag.forEach(function(tag) {
        obj.tags.push(tag.toLowerCase());
      });
    }
  },

  getImage: function(doc, obj) {
    if (doc.media && doc.media.image instanceof Object) {
      obj.image = doc.media.image.url;
    }
  },

  getTopics: function(doc, obj) {
    if (doc.topics && doc.topics instanceof Object && doc.topics.topic instanceof Array) {
      var topics = {};
      doc.topics.topic.forEach(function(item) {
        topics[item.group.toLowerCase()] = true;
        var name = item.name.toLowerCase().replace(/ news$/,"");
        name = name.replace(/ latest$/,"");
        topics[name] = true;
      });
      var keys = Object.keys(topics);
      if (keys.length > 0) {
        obj.topics = keys;
        obj.iab = utils.mapTopicsToIAB(obj.topics);
      }
    }
  },

  getCompanies: function(doc, obj) {
    if (doc.topics && doc.companies instanceof Object) {
      if (doc.companies.company instanceof Array) {
        var comps = {};
        doc.companies.company.forEach(function(comp) {
          comps[comp.name.toLowerCase()] = true;
        });
        obj.companies = Object.keys(comps);
      } else if (doc.companies.company instanceof Object) {
        obj.companies = [doc.companies.company.name.toLowerCase()];
      }
    }
  },

  getSemantic: function(doc, obj) {
    var props = {};
    var names = {};
    function objectWalker(object, parentKey) {
      if (object instanceof Array) {
        object.forEach(function(child) {
          objectWalker(child, parentKey);
        });
      }
      else if (parentKey == "property" && object.name == "value") {
        // extract named entities from text
        //props[object.value.toLowerCase()] = true;
        var rawWords = object.value.replace(kNotWordPattern, " ").split(/\s+/);
        rawWords.forEach(function(word) {
          if (word.match(/^[A-Z]/) != null) {
            names[word] = true;
          }
        });
        props[object.value] = true;
      }
      else if (object instanceof Object) {
        Object.keys(object).forEach(function(key) {
          objectWalker(object[key], key);
        });
      }
    };
    objectWalker(doc.semantics, "semantics");
    var keys = Object.keys(props);
    if (keys.length > 0) {
      obj.semantics = keys;
    }
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

  computeTitleHashes: function(host, title) {
    var titleHashes = {};
    if (title) {
      var cleanedTitle = utils.removeHostTrailer(host, title);
      var prefixCleanedTitle = cleanedTitle.replace(/^[^:][^:]*:[^A-Za-z0-9]*/,"");
      titleHashes[utils.computeStringHash(title)] = true;
      titleHashes[utils.computeStringHash(cleanedTitle)] = true;
      titleHashes[utils.computeStringHash(prefixCleanedTitle)] = true;
    }

    return Object.keys(titleHashes);
  },

  filter: function(doc) {
    if (!doc.originalUrl) {
      console.log("MISSING ORIGINAL URL " + JSON.stringify(doc));
      return null;
    }
    var host = require("url").parse(doc.originalUrl).host;
    if (!host) {
      console.log("FIALED TO PARSE ORIGINAL URL " + doc.originalUrl);
      console.log(JSON.stringify(doc));
      return null;
    }

    var obj = {
      id: parseInt(doc.id),
      sequenceId: parseInt(doc.sequenceId),
      title: doc.title,
      titleHash: this.computeTitleHashes(host, doc.title),
      content: doc.content,
      published: Math.floor(Date.parse(doc.publishedDate) / 1000),
      harvested: Math.floor(Date.parse(doc.harvestDate) / 1000),
      url: doc.originalUrl,
      urlHash: utils.computeStringHash(doc.originalUrl),
      duplicateGroupId: doc.duplicateGroupId,
      source: doc.source.homeUrl,
      host: utils.normalizeHost(host),
      revHost: utils.normalizeReverseHost(host)
    };

    this.getTags(doc, obj);
    this.getImage(doc, obj);
    this.getTopics(doc, obj);
    this.getCompanies(doc, obj);
    var names = this.getSemantic(doc, obj);
    //this.getWordArray(doc, obj, names);
    return obj;
  },

  oldFormatFixUp: function(doc) {
    // compute iab if needed
    if (doc.topics && !doc.iab) {
      doc.iab = utils.mapTopicsToIAB(doc.topics);
    }
    // recompute title hashes
    doc.titleHash = this.computeTitleHashes(doc.host, doc.title);
  },
};

module.exports = MoreoverStoryFilter;
