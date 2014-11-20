var mongo = require('mongoskin');
var crypto = require('crypto');
var tldjs = require('tldjs');
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
  this.readHostTable(cb);
};

HostKeeper.getHostInfo = function(arg) {
  var ret = {};
  if (arg instanceof Array) {
    arg.forEach(function(host) {
      if (this.hosts[host]) ret[host] = this.hosts[host];
    }.bind(this));
  }
  else {
    if (this.hosts[arg]) ret[arg] = this.hosts[arg];
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

HostKeeper.getHostDocsClearTitles = function(host, titles, cb) {
  var clientHashes = titles.map(function(title) {
    return utils.computeStringHash(utils.removeHostTrailer(host, title));
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

