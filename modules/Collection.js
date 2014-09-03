var mongo = require('mongoskin');

function Collection(dbname, collection) {
  this.db = mongo.db("mongodb://localhost:27017/" + dbname, {native_parser:true});
  this.collection = this.db.collection(collection);
};

Collection.prototype = {
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
};

module.exports = Collection;
