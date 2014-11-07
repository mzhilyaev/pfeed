var mongo = require('mongoskin');
var when = require('when');
var config = require("../config/config");
var utils = require("./Utils");
var Collection = require("./Collection");
var termAnnotator = require("./TermAnnotator");

var DocHelper = Object.create(Collection.prototype);

DocHelper.init = function(dbname, collection, cb) {
  var dbName = dbname || config.docs.database;
  var collectionName = collection || config.docs.collection;
  var self = this;
  this.annotate = config.docs.annotateOnInsert || false;
  // @TODO - remove index creation into an admin script
  Collection.call(this, dbName, collectionName, function() {
    self.collection.ensureIndex({id: 1}, {unique: true}, function(err,res) {
      self.collection.ensureIndex({urlHash: 1}, {unique: true}, function(err,res) {
        self.collection.ensureIndex({revHost: 1, sequenceId: -1}, function(err,res) {
          self.collection.ensureIndex({revHost: 1, harvested: -1}, function(err,res) {
            if (cb) cb();
          });
        });
      });
    });
  });
};

DocHelper.getRecentDocsForSite = function(callback, searchEntry) {
  //console.log(JSON.stringify(searchEntry));
  var findEntry = {
    // @TODO - esacope periods in regexp otherwise riskmatching wrong hosts
    revHost: {$regex: new RegExp("^" + utils.normalizeReverseHost(searchEntry.host))},
  };
  if (searchEntry.sequenceId) {
    findEntry.sequenceId  = {$gt: searchEntry.sequenceId};
  }
  if (searchEntry.secondsAgo) {
    findEntry.harvested  = {$gt: Math.floor(Date.now()/1000) - searchEntry.secondsAgo};
  }
  var limit = searchEntry.limit || 100;
  return this.collection.find(findEntry)
  .sort({sequenceId: -1})
  .limit(limit)
  .toArray(function(err, results) {
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
  if (this.annotate) {
    docs.forEach(function(doc) {
      termAnnotator.annotate(doc);
    });
  }
  this.collection.insert(docs, {continueOnError: true}, function(err,res) {
    // ingore duplicate keys error
    // if (err) throw err;
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

DocHelper.getHostCursor = function(host) {
  return this.collection.find({host: host}, {"_id": 0});
};

DocHelper.selectDocByUrlHash = function(host, hashes, crowdFactor, cb) {
  var cursor = this.collection.find({
    host: host,
  },
  {
    "_id": 0,
  })
  .sort({id: 1});
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

DocHelper.selectDocByTitleHash = function(host, hashes, cb) {
  var cursor = this.collection.find({
    host: host,
    titleHash: {$in: hashes}
  },
  {
    "_id": 0,
  })
  .sort({sequenceId: 1})
  .toArray(function(err, results) {
    if (err) throw err;
    cb({
      host: host,
      docs: results,
    });
  });
};

DocHelper.drainHostDocReader = function(hostDocReader, cb) {
  var self = this;
  function drainNext(docs) {
    if (docs) {
      self.insertDocuments(docs, function() {
        setTimeout(function () {
          hostDocReader.next(drainNext);
        }, 0);
      });
    }
    else {
      // finished draining
      cb();
    }
  };

  hostDocReader.next(drainNext);
};

module.exports = DocHelper;

