var mongo = require('mongoskin');

function Collection(db, colName, cb) {
  if (db instanceof Object) {
    // assume connection is passed in
    this.db = db;
  }
  else {
    // assume db is dbname
    this.db = mongo.db("mongodb://localhost:27017/" + db, {native_parser:true, safe:true});
  }
  this.db.collection(colName, function(err, col) {
    if (err) throw err;
    this.collection = col;
    if (cb) cb(this.collection);
  }.bind(this));
};

Collection.prototype = {
  newCollection: function(name) {
    return new Collection(this.db, name);
  },

  clarCollection: function(cb) {
    this.collection.remove({}, function(err,result) {
      if(cb) cb();
    });
  },

  getCollection: function() {
    return this.collection;
  },

  getCollectionSize: function(cb) {
    this.collection.find({}).count(function(err, result) {
      if (err) throw err;
      cb(result);
    });
  },

  getUnorderedBulk: function() {
    return this.collection.initializeUnorderedBulkOp();
  },

  getOrderedBulk: function() {
    return this.collection.initializeOrderedBulkOp();
  },
};

module.exports = Collection;
