var mongo = require('mongoskin');
var config = require("../config/config");
var Collection = require("./Collection");

var HostTracker = Object.create(Collection.prototype);

HostTracker.init = function(dbname, collection) {
  var dbName = dbname || config.hosts.database;
  var collectionName = collection || config.hosts.collection;
  Collection.call(this, dbName, collectionName);
  // this is an async call - and should have callback
  this.collection.ensureIndex( { host: 1 }, { unique: true }, function(err,res) {
    console.log("index exists");
  });
};

HostTracker.insertHosts = function(hosts, cb) {
  var hostsArray;
  if (hosts instanceof Array) {
    hostsArray = hosts.map(function(host) {
      return {host: host};
    });
  }
  else {
    hostsArray = [{host: hosts}];
  }
  this.collection.insert(
    hostsArray,
    {continueOnError: true},
    function (err, result) {
      if (err) {
        // ignore duplicate key errors
        // console.log("Ignore error " + err);
      }
      if (cb) {
        cb();
      }
    }
  );
};

module.exports = HostTracker;

