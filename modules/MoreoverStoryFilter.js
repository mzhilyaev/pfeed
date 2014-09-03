var hasher = require('hash-string');

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
      obj.topics = {groups: {}, names: {}};
      doc.topics.topic.forEach(function(item) {
        obj.topics.groups[item.group] = true;
        obj.topics.names[item.name] = true;
      });
    }
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
      urlHash: hasher.hashCode(doc.originalUrl),
      duplicateGroupId: doc.duplicateGroupId,
      source: doc.source.homeUrl,
      host: require("url").parse(doc.source.homeUrl).host,
    };
    this.getTags(doc, obj);
    this.getImage(doc, obj);
    this.getTopics(doc, obj);
    return obj;
  },
};

module.exports = MoreoverStoryFilter;
