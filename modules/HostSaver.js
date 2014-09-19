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

HostSaver = {
  init: function() {
    utils.ensureDirectory(path.join(config.rootDir, config.workDir));
    this.outputDir = path.join(config.rootDir, config.workDir, config.download.hostsOutputDir);
    utils.ensureDirectory(this.outputDir);
    this.collector = {};
  },

  clear: function(cb) {
    require('child_process').exec('/bin/rm -rf ' + this.outputDir, function(err, stdout, stderr) {
      if (err) throw err;
      if (cb) cb();
    });
  },

  consume: function(doc) {
    if (doc.host) {
      if (!this.collector[doc.host]) {
        this.collector[doc.host] = [];
      }
      this.collector[doc.host].push(doc);
    }
  },

  getHostDir: function(host) {
    var revHost = host.split('').reverse().join('');
    for (var i in config.subRevHosts) {
      if (revHost.indexOf(config.subRevHosts[i]) == 0) {
        var domainDir = path.join(this.outputDir, config.subRevHostsMap[config.subRevHosts[i]]);
        utils.ensureDirectory(domainDir);
        return path.join(domainDir, host);
      }
    }
    // domain not found
    return path.join(this.outputDir, host);
  },

  flush: function(date) {
    console.log("flushing hosts docs to disk");
    Object.keys(this.collector).forEach(function(host) {
      this.flushHost(host, date);
    }.bind(this));
    this.collector = {};
  },

  flushHost: function(host, date) {
    // make surte host directory exists
    var hostDir = this.getHostDir(host);
    utils.ensureDirectory(hostDir);
    var docs = this.collector[host];
    var harvestDate = date || (new Date(Date.now()));
    var file = path.join(hostDir, harvestDate.toFormat("YYYY.MM.DD"));
    var fileFd = fs.openSync(file, "a+");
    docs.forEach(function(doc) {
      fs.writeSync(fileFd, JSON.stringify(doc));
      fs.writeSync(fileFd, "\n");
    }.bind(this));

    fs.closeSync(fileFd);
  },

  readHostDocs: function(host, cb) {
    var hostDir = this.getHostDir(host);
    if (!fs.existsSync(hostDir)) {
      cb(null);
      return;
    }

    // readin data files in descending order
    var files = fs.readdirSync(hostDir).sort(descOrderComp);
    var finished = 0;
    files.forEach(function(file) {
      var lineStream = new LineStream();
      lineStream.on('data', function(line) {
        try {
          cb(JSON.parse(line));
        } catch (e) {}
      });
      lineStream.on('end', function() {
        finished++;
        if (finished == files.length) {
          cb(null);
        }
      });
      var fileStream = fs.createReadStream(path.join(hostDir, file));
      // @TODO - rew-write with endsWith
      if (file.match(/.gz$/)) {
        var gunzipStream = zlib.createGunzip();
        fileStream.pipe(gunzipStream).pipe(lineStream);
      }
      else {
        fileStream.pipe(lineStream);
      }
    });
  },

  getHostDocReader: function(host) {
    var hostDir = this.getHostDir(host);
    if (!fs.existsSync(hostDir)) return null;
    else                         return new HostDocReader(hostDir);
  },
};

module.exports = HostSaver;

