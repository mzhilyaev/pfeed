#!/usr/local/bin/node

var mongo = require("mongoskin");
var when = require("when");
var config = require("../config/config");

var dbHost = process.argv[2];
var dbPort = 27017;
var dbName = "moreover2";
var colName = "docs";
var host=process.argv[3];

var db = mongo.db("mongodb://" + dbHost + ":" + dbPort + "/" + dbName, {native_parser:true, safe:true});
var collection;

when.promise(function(resolve) {
  db.collection(colName, function(err, col) {
    if (err) throw err;
    collection = col;
    resolve();
  });
})
.then(function () {
  var cursor = collection.find({
    host: host,
  }
  )
  .sort({sequenceId: -1})
  //.limit(10)
  ;

  cursor.each(function(err, results) {
    if (results != null) {
      console.log(JSON.stringify(results));
    }
    else {
      setTimeout(function() {db.close();});
    }
  });
})
