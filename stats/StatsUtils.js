var fs = require("fs");
var path = require("path");
var tld = require('tldjs');
var mongo = require("mongoskin");
var when = require("when");

var StatsUtils = {

  runSearch: function(options, collectCb, outputCb) {
    var dbHost = options.dbHost || "localhost";
    var dbPort = options.dbPort || 27017;
    var dbName = "moreover";
    var colName = "docs";

    // set up db connection
    var db = mongo.db("mongodb://" + dbHost + ":" + dbPort + "/" + dbName, {native_parser:true, safe:true});

    // set up search query
    var searchObj = {
      "topics": {$exists: true},
    };

    // check for from parameter
    if (options.fromDate) {
      if (options.verbous) console.error(options.fromDate);
      var fromDateParams = options.fromDate.split("/").map(function(chunk) {return parseInt(chunk);});
      var date = new Date(fromDateParams);
      if (!searchObj.harvested) searchObj.harvested = {};
      searchObj.harvested["$gt"] = date.getTime() / 1000;
    }

    // check for to parameter
    if (options.toDate) {
      if (options.verbous) console.error(options.toDate);
      var toDateParams = options.toDate.split("/").map(function(chunk) {return parseInt(chunk);});
      var date = new Date(toDateParams);
      if (!searchObj.harvested) searchObj.harvested = {};
      searchObj.harvested["$lt"] = date.getTime() / 1000;
    }

    // init the collection and make the search
    var collection;
    when.promise(function(resolve) {
      db.collection(colName, function(err, col) {
        if (err) throw err;
        collection = col;
        resolve();
      });
    })
    .then(function () {
      if (options.verbous) console.error("SEARCH OBJ" , searchObj);
      var cursor = collection.find(
      searchObj,
      {url: 1, title: 1, topics: 1, urlHash: 1, harvested: 1, "_id": 0})
      .limit((options.limit) ? parseInt(options.limit) : 1000000000);

      var index = 0;
      var lastTime = Date.now();
      cursor.each(function(err, results) {
        index++;
        if (options.verbous && index % 1000 == 0) {
          console.error("%d - %d  %s\r", (Date.now() - lastTime), index, new Date(results.harvested*1000));
          lastTime = Date.now();
        }
        var array = [];
        var titles = {};
        var count = 0;
        if (results != null) {
          collectCb(results.url, results.title, results.topics, results.urlHash)
        }
        else {
          //fs.writeFile('cat.stats', JSON.stringify(stats));
          setTimeout(function() {db.close();});
          if (outputCb) outputCb();
        }
      });
    })
  },

};

module.exports = StatsUtils;
