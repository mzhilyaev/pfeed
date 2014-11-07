var mongo = require('mongoskin');
var crypto = require('crypto');
var tldjs = require('tldjs');
var hasher = require('hash-string');
var config = require("../config/config");
var Collection = require("./Collection");
var docHelper = require("./DocHelper");
var utils = require("./Utils");

var HostKeeper = Object.create(Collection.prototype);

HostKeeper.init = function(dbname, collection, cb) {
  var dbName = dbname || config.hosts.database;
  var collectionName = collection || config.hosts.collection;
  Collection.call(this, dbName, collectionName, function(col) {
    this.readHostTable(cb);
  }.bind(this));
};

HostKeeper.readHostTable = function(cb) {
  this.collection.find({}, {"_id": 0}).toArray(function(err, results) {
    // walk the hosts and build the table
    this.hosts = {};
    for (var i in results) {
      this.hosts[results[i].host] = results[i];
    }
    if (cb) cb();
  }.bind(this));
};

HostKeeper.refresh = function(cb) {
  this.readHostTable(function() {
    this.updateCrowdFactor(cb);
  }.bind(this));
};

HostKeeper.updateCrowdFactor = function(cb) {
  // fiund out how many docs are stored for each host
  docHelper.aggregateHostDocCount(function(results) {
    var bulk = this.getUnorderedBulk();
    var inserted = false;
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
        inserted = true;
      }
    }.bind(this));
    // if there's an operation recorded in bulk
    if (inserted) {
      bulk.execute(function(err, res) {
        // console.log("modified " + res.nModified);
        if (err) throw err;
        if (cb) cb();
      });
    } else {
    // otherwise run callback
      cb();
    }
  }.bind(this));
}

HostKeeper.getHostInfo = function(arg) {
  var ret = {};
  if (arg instanceof Array) {
    arg.forEach(function(host) {
      ret[host] = this.hosts[host];
    }.bind(this));
  }
  else {
    ret[arg] = this.hosts[arg];
  }
  return ret;
};


HostKeeper.getHostDocs = function(host, hashes, cb) {
  var clientHashes;
  if (hashes instanceof Array) {
    clientHashes = hashes;
  }
  else {
    clientHashes = [hashes];
  }

  if (this.hosts[host]) {
    docHelper.selectDocByTitleHash(host, clientHashes, cb);
  }
  else {
    cb({});
  }
};

HostKeeper.cleanseTitle = function(host, title) {
  var domain = tldjs.getDomain(host);
  // extract the first name of the domain
  var leadingTerm = domain.split('.')[0];
  var regex = new RegExp("[^A-Za-z0-9]*" + leadingTerm + ".*$", "i");
  var cleansed = title.replace(regex, "");
  return cleansed;
};

HostKeeper.getHostDocsClearTitles = function(host, titles, cb) {
  var clientHashes = titles.map(function(title) {
    return utils.computeStringHash(this.cleanseTitle(host, title));
  }.bind(this));

  // console.log(clientHashes);
  return this.getHostDocs(host, clientHashes, cb);
};

HostKeeper.isListed = function(host) {
  return this.hosts[host] != null;
};

HostKeeper.downloadRefresh = function(cb) {
  console.log("Refreshing for next download");
  this.readHostTable(function() {
    if (cb) cb();
  }.bind(this));
};

module.exports = HostKeeper;

