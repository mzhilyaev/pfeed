var utils = require('./Utils');
var url = require("url");

function SiteStats(host) {
  this.host = host;
  this.stats = {
    size: 0,
    df: {},
    first50: {},
    urlChunks: {},
    topics: {},
  };
};

SiteStats.prototype = {
  consumeDoc: function(doc) {
    var seen = {};
    var wcount = 0;
    for (var i in doc.words) {
      var word = doc.words[i].toLowerCase();
      if (!seen[word]) {
        this.stats.df[word] = (this.stats.df[word] || 0) + 1;
        seen[word] = true;
        if (wcount < 50) {
          this.stats.first50[word] = (this.stats.first50[word] || 0) + 1;
        }
      }
      wcount++;
    }

    var topics = doc.topics || [];
    for (var i in topics) {
      var topic = topics[i];
      this.stats.topics[topic] = (this.stats.topics[topic] || 0) + 1;
    }

    var obj = url.parse(doc.url);
    // break the pathname into chunk
    var chunks = obj.pathname.split("/");
    for (var i in chunks) {
      var chunk = chunks[i];
      if (chunk != "") {
        this.stats.urlChunks[chunk] = (this.stats.urlChunks[chunk] || 0) + 1;
      }
    }

    this.stats.size ++;
  },

  cleanStats: function() {
    Object.keys(this.stats.urlChunks).forEach(function(chunk) {
      if (this.stats.urlChunks[chunk] <= 1 || !chunk.match(/[a-zA-Z]/)) {
        delete this.stats.urlChunks[chunk];
      }
    }.bind(this));
  },

  getStats: function() {
    console.log(this.stats.size, "==========");
    return this.stats;
  },
};

module.exports = SiteStats;
