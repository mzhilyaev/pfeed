var mongo = require('mongoskin');
var fs = require('fs');
var path = require('path');
var config = require("../config/config");
var Collection = require("./Collection");
var docHelper = require("./DocHelper");
var hostSaver = require("./HostSaver");
var utils = require("./Utils");

var HOUR_MILLI_SECONDS = 3600000;

var HostDrainer = Object.create(Collection.prototype);

HostDrainer.init = function(dbname, collection, cb) {
  var dbName = dbname || config.hosts.database;
  var collectionName = collection || config.hosts.collection;
  this.drainInterval = config.download.drainInterval || 60000;
  this.drains = {};

  Collection.call(this, dbName, collectionName, function(col) {
    if (cb) cb();
  }.bind(this));
};

HostDrainer.readHostTable = function() {
  this.collection.find({}, {"_id": 0, host: 1, drain: 1}).toArray(function(err, results) {
    for (var i in results) {
      var entry = results[i];
      if (!this.drains[entry.host]  && (entry.drain == null || !entry.drain.done)) {
        this.drainHost(entry);
      }
    }
  }.bind(this));
};

HostDrainer.fireOne = function(interval) {
  if (this.pleaseStop) return;
  this.nextTimeout = setTimeout(function() {
    this.readHostTable();
    this.fireOne();
  }.bind(this), interval || this.drainInterval);
};

HostDrainer.start = function() {
  this.fireOne(100);
};

HostDrainer.stop = function(cb) {
  this.pleaseStop = true;
  this.stopCallback = cb;
  clearTimeout(this.nextTimeout);
  this.waitForWorkersClosed();
};

HostDrainer.waitForWorkersClosed = function() {
  // we must wait until all drains are done
  if (Object.keys(this.drains).length == 0) {
    this.closeDb();
    if (this.stopCallback) this.stopCallback();
  }
};

HostDrainer.drainHost = function(entry) {
  var self = this;
  var host = entry.host;
  var hostEntry = entry.drain || {done: false};
  var hostDocReader = hostSaver.getHostDocReader(host, hostEntry.file);
  var drainEntry = self.drains[host] = {
    reader: hostDocReader,
  };

  function updateDbRecord(cb) {
    self.collection.update(
      {host: host},
      {$set: {drain: hostEntry}},
      function(err, res) {
        if (err) throw err;
        // make sure the drain entry in the current host table same as in db
        if (cb) cb();
      }
    );
  };

  function doit() {
    if (self.pleaseStop) {
      // if we are stopping, update and write host etnry
      // then remove drain entry and call eaitForWorkersClosed
      updateDbRecord(function() {
        // host is updated, remove it from drains array
        delete self.drains[host];
        // and call waitForWorkersClosed to check if all drains are removed
        setTimeout(function() {self.waitForWorkersClosed();});
      });
      // and return from the function
      return;
    }
    // otherwise proceed with the next chunk
    drainEntry.reader.next(function(docs, file) {
      if (docs == null) {
        // host is fully drained: update db record and remove drain entry
        hostEntry.done = true;
        updateDbRecord(function() {
          delete self.drains[host];
        });
      }
      else {
        // insert next this chunk into database
        console.log("Inserting docs in " + host + "/" + file);
        docHelper.insertDocuments(docs, function() {
          console.log("Inserted " + docs.length + " from " + host + "/" + file);
          // insertion is over, update hostEntry
          hostEntry.file = file;
          // setup next read
          setTimeout(doit,1000);
        });
      }
    });
  };

  if (hostDocReader == null) {
    // nothing to drain
    updateDbRecord(function() {
        hostEntry.done = true;
        updateDbRecord(function() {
          delete self.drains[host];
        });
    });
    return;
  }

  console.log("Draining host " + host);
  doit();
}

module.exports = HostDrainer;
