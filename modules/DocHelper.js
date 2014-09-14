var mongo = require('mongoskin');
var config = require("../config/config");
var Collection = require("./Collection");

var DocHelper = Object.create(Collection.prototype);

DocHelper.init = function(dbname, collection, cb) {
  var dbName = dbname || config.docs.database;
  var collectionName = collection || config.docs.collection;
  Collection.call(this, dbName, collectionName, function() {
    this.collection.ensureIndex( { id: 1 }, { unique: true }, function(err,res) {
      if (cb) cb();
    });
  }.bind(this));
};

DocHelper.getRecentDocsForSite = function(callback, site, seconds) {
  var secondsBack = seconds || 0;
  var sites;
  if (site instanceof Array) {
    sites = site;
  } else {
    sites = [site];
  }
  return this.collection.find({
    host: {$in: sites},
    published: {$gt: (secondsBack<=0) ? 0 : Math.floor(Date.now()/1000) - secondsBack}
  }).toArray(function(err, results) {
    if (err) throw err;
    callback(results);
  });
};

DocHelper.addDocument = function(doc, cb) {
  this.collection.update(
    {id: doc.id},
    doc,
    {upsert: true },
    function (err, result) {
      if (err) throw err;
      if (cb) cb();
  });
};

DocHelper.insertDocuments = function(doc, cb) {
  var docs;
  if (doc instanceof Array) {
    docs = doc;
  }
  else {
    docs = [doc];
  }
  this.collection.insert(docs, function(err,res) {
    if (err) throw err;
    if (cb) cb();
  });
};

DocHelper.aggregateHostDocCount = function(cb) {
  this.collection.aggregate(
    {$group: {_id: "$host", count: {$sum: 1}}},
    function(err, results) {
       if (err) throw err;
       var ret = {};
       for (var i in results) {
         var item = results[i];
         ret[item._id] = item.count;
       }
       cb(ret);
  });
};

DocHelper.selectDocByUrlHash = function(host, hashes, crowdFactor, cb) {
  console.log(host, JSON.stringify(hashes));
  var cursor = this.collection.find({
    host: host,
  },
  {
    "_id": 0,
  });
  var res = {
    host: host,
    crowdFactor: crowdFactor,
    docs: [],
  };
  cursor.each(function(err, doc) {
    if (doc != null) {
      var urlHash = doc.urlHash % crowdFactor;
      if (hashes[urlHash]) {
        res.docs.push(doc);
      }
    } else {
      cb(res);
    }
  });
};

module.exports = DocHelper;

