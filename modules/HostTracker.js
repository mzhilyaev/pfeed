var mongo = require('mongoskin');
var config = require("../config/config");
var utils = require("./Utils");
var Collection = require("./Collection");

var HostTracker = Object.create(Collection.prototype);

HostTracker.init = function(dbname, collection, cb) {
  var dbName = dbname || config.hosts.database;
  var collectionName = collection || config.hosts.collection;
  Collection.call(this, dbName, collectionName, function() {
    this.collection.ensureIndex( { host: 1 }, { unique: true }, function(err,res) {
      if (cb) cb();
    });
  }.bind(this));
};

HostTracker.insertHosts = function(hosts, cb) {
  var hostsArray;
  if (hosts instanceof Array) {
    hostsArray = hosts.map(function(host) {
      return {host: utils.normalizeHost(host)};
    });
  }
  else {
    hostsArray = [{host: utils.normalizeHost(hosts)}];
  }
  this.collection.insert(
    hostsArray,
    {continueOnError: true},
    function (err, result) {
      if (err) {
        // ignore duplicate key errors
        // console.log("Ignore error " + err);
        // console.log("ERROROR " + err);
      }
      if (cb) {
        cb();
      }
    }
  );
};

module.exports = HostTracker;

