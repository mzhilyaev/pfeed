#!/usr/local/bin/node

var mongo = require("mongoskin");
var when = require("when");
var config = require("../config/config");
var RevMap = require("../refData/IAB").RevMap;
var MoreoverMap = require("../refData/moreover_to_IAB").MoreoverToIABMap;

var dbHost = "ec2-54-87-201-148.compute-1.amazonaws.com";
//var dbHost = "localhost";
var dbPort = 27017;
var dbName = "moreover2";
var colName = "docs";
var host="cnn.com";
var pattern = process.argv[2] || /\/politics\//;
var category = process.argv[2] || "politics";

var db = mongo.db("mongodb://" + dbHost + ":" + dbPort + "/" + dbName, {native_parser:true, safe:true});
var collection;

var stats = {};

function addToStats(key, cats) {
  if(!stats[key]) {
    stats[key] = {
      count: 0,
      cats: {},
    };
  }
  stats[key].count++;
  cats.forEach(function(cat) {
    stats[key].cats[cat] = (stats[key].cats[cat] || 0) + 1;
  });
};

function accumulate(url, title, topics) {
  // compute IAB cats
  var cats = {};
  topics.forEach(function(topic) {
    var cat = MoreoverMap[topic];
    if (cat && RevMap[cat]) {
      RevMap[cat].forEach(function(name) {
        cats[name] = true;
      });
    }
  });
  if (process.argv[4] != null) {
    console.log("d " + url, " : ", Object.keys(cats), " <= ", JSON.stringify(topics));
  }
  //deal with hosts
  var urlObj = require("url").parse(url);
  var host = urlObj.hostname;
  if (host.match(/^rss\./)) return;

  var catNames = Object.keys(cats);
  addToStats("_ANY_", catNames);
  addToStats("_HOST_"+host, catNames);

  var pathBits = urlObj.pathname.split("/");
  pathBits.forEach(function(chunk) {
    if (chunk.match(/[A-Za-z]/) && chunk.length < 20) {
      addToStats("_PATH_" + chunk, catNames);
      //addToStats("_HOST_PATH_" + host + "_" + chunk, catNames);
    }
  });
};

function outputStats() {
  var precLevel = process.argv[3] || 50;
  var bestPrec = {};
  var sortedKeys = Object.keys(stats).sort(function(a,b) {
    return stats[b].count - stats[a].count;
  });

  sortedKeys.forEach(function(key) {
    var keyStats = stats[key];
    if (keyStats.count > 10) {
      var goodCats = [];
      Object.keys(keyStats.cats).forEach(function(cat) {
        var seenDocs = keyStats.cats[cat];
        var prec = Math.round(seenDocs * 100 / keyStats.count);
        if (prec >= precLevel || key == "_ANY_") {
          if (bestPrec[cat] == null || prec > bestPrec[cat]) {
            goodCats.push([cat, prec]);
            bestPrec[cat] = prec;
          }
        }
      });
      if (goodCats.length > 0) {
        if (key == "_ANY_") {
          key = "_ANY_" + process.argv[2];
        }
        console.log(key + ":" + keyStats.count, JSON.stringify(goodCats.sort(function(a,b) {return b[1] - a[1];}).slice(0,4)));
      }
    }
  });
};

when.promise(function(resolve) {
  db.collection(colName, function(err, col) {
    if (err) throw err;
    collection = col;
    resolve();
  });
})
.then(function () {
  collection.find({
    "host": process.argv[2],
    "topics": {$exists: true}
  },
  {url: 1, title: 1, topics: 1, "_id": 0})
  //.limit(100000)
  .toArray(function(err, results) {
    var array = [];
    var titles = {};
    var count = 0;
    for (var i in results) {
      accumulate(results[i].url, results[i].title, results[i].topics)
      //console.log(results[i].url, results[i].title, results[i].topics)
    }
    outputStats();
    setTimeout(function() {db.close();});
  });
})
