var hasher = require('hash-string');
var crypto = require('crypto');
var tld = require('tldjs');

var MoreoverStoryFilter = {

  getTags: function(doc, obj) {
    if (doc.tags && doc.tags instanceof Object) {
      obj.tags = doc.tags.tag;
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
        topics[item.group] = true;
        var name = item.name.replace(/ news$/,"");
        topics[name] = true;
      });
      var keys = Object.keys(topics);
      if (keys.length > 0) {
        obj.topics = keys;
      }
    }
  },

  getCompanies: function(doc, obj) {
    if (doc.topics && doc.companies instanceof Object) {
      if (doc.companies.company instanceof Array) {
        var comps = {};
        doc.companies.company.forEach(function(comp) {
          comps[comp.name] = true;
        });
        obj.companies = Object.keys(comps);
      } else if (doc.companies.company instanceof Object) {
        obj.companies = [doc.companies.company.name];
      }
    }
  },

  getSemantic: function(doc, obj) {
    var props = {};
    function objectWalker(object, parentKey) {
      if (object instanceof Array) {
        object.forEach(function(child) {
          objectWalker(child, parentKey);
        });
      }
      else if (parentKey == "property" && object.name == "value") {
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
  },

  computeUrlHash: function(url) {
    var md5 = crypto.createHash('md5').update(url).digest("hex");
    return Math.abs(hasher.hashCode(md5));
  },

  filter: function(doc) {
    if (doc.language != "English") return null;
    var obj = {
      id: doc.id,
      sequenceId: doc.sequenceId,
      title: doc.title,
      content: doc.content,
      published: Math.floor(Date.parse(doc.publishedDate) / 1000),
      harvested: Math.floor(Date.parse(doc.harvestDate) / 1000),
      url: doc.originalUrl,
      urlHash: this.computeUrlHash(doc.originalUrl),
      duplicateGroupId: doc.duplicateGroupId,
      source: doc.source.homeUrl,
      host: tld.getDomain(require("url").parse(doc.source.homeUrl).host),
    };
    this.getTags(doc, obj);
    this.getImage(doc, obj);
    this.getTopics(doc, obj);
    this.getCompanies(doc, obj);
    this.getSemantic(doc, obj);
    return obj;
  },
};

module.exports = MoreoverStoryFilter;
