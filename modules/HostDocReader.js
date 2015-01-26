var fs = require("fs");
var path = require("path");
var dateUtils = require("date-utils");
var LineStream = require('byline').LineStream;
var zlib = require("zlib");

var config = require("../config/config");
var utils = require("./Utils");

// descending order compare function
function descOrderComp(a, b) {
  return (a<b) ? 1 : ((b==a) ? 0 : -1);
}

function HostDocReader(hostDir, startFile) {
  this.hostDir = hostDir;
  // sort files in descending order - youngest file first
  this.files = fs.readdirSync(hostDir).sort(descOrderComp);
  if (startFile) {
    while (this.files.length && this.files[0] <= startFile) {
      this.files.shift();
    }
  }
};

HostDocReader.prototype = {
  next: function(cb) {
    if (this.files.length == 0) {
      // execute callback when function exists
      setTimeout(function() {cb(null);}, 0);
      return;
    }
    // otherwise pick the next file and process it
    var file = this.files.shift();
    var docArray = [];
    var lineStream = new LineStream();
    lineStream.on('data', function(line) {
      try {
        var doc = JSON.parse(line);
        docArray.push(doc);
      } catch (e) {}
    });
    lineStream.on('end', function() {
      // execute callback when function exists
      setTimeout(function() {cb(docArray, file);}, 0);
    });
    var fileStream = fs.createReadStream(path.join(this.hostDir, file));
    // @TODO - rew-write with endsWith
    if (file.match(/.gz$/)) {
      var gunzipStream = zlib.createGunzip();
      fileStream.pipe(gunzipStream).pipe(lineStream);
    }
    else {
      fileStream.pipe(lineStream);
    }
  },
};

module.exports = HostDocReader;

