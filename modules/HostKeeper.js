var mongo = require('mongoskin');
var crypto = require('crypto');
var hasher = require('hash-string');
var config = require("../config/config");
var Collection = require("./Collection");
var docHelper = require("./DocHelper");

var HostKeeper = Object.create(Collection.prototype);

HostKeeper.init = function(dbname, collection, cb) {
  var dbName = dbname || config.hosts.database;
  var collectionName = collection || config.hosts.collection;
  Collection.call(this, dbName, collectionName, function(col) {
    this.readHostTable(cb);
  }.bind(this));
};

HostKeeper.readHostTable = function(cb) {
  this.collection.find({}).toArray(function(err, results) {
    // walk the hosts and build the table
    this.hosts = {};
    for (var i in results) {
      this.hosts[results[i].host] = results[i];
    }
    if (cb) cb();
  }.bind(this));
};

HostKeeper.updateCrowdFactor = function(cb) {
  // fiund out how many docs are stored for each host
  docHelper.aggregateHostDocCount(function(results) {
    var bulk = this.getUnorderedBulk();
    Object.keys(results).forEach(function(host) {
      var hostRecord = this.hosts[host];
      if (!hostRecord) return;
      // if there is not crowd factor or number of documents
      // under the host increased by 30% over what it used to be
      if (!hostRecord.crowdFactor || results[host] >= 1.3 * hostRecord.crowdFactor.size) {
        // recompute the croadFactor so there is about 3 coliisions
        hostRecord.crowdFactor = {
          size: results[host],
          factor: Math.floor(results[host]/3) + 1,
        };
        bulk.find({host: host}).update({$set: {crowdFactor: hostRecord.crowdFactor}});
      }
    }.bind(this));
    bulk.execute(function(err, res) {
      console.log(res.nModified);
      if (err) throw err;
      if (cb) cb();
    });
  }.bind(this));
}

module.exports = HostKeeper;

