var fs = require("fs");
var path = require("path");
var tld = require('tldjs');
var hasher = require('string-hash');
var crypto = require('crypto');
var config = require('../config/config');
var RevMap = require("../refData/IAB").RevMap;
var MoreoverMap = require("../refData/moreover_to_IAB").MoreoverToIABMap;

var Utils = {

  // Date Utils
  makeDateDirectory: function(root, theDate) {
    var dt = theDate || (new Date());
    var year = dt.getUTCFullYear();
    var month = dt.getUTCMonth() + 1;
    var day = dt.getUTCDate();

    var dirPath = path.join(root, "" + year);
    this.ensureDirectory(dirPath);

    dirPath = path.join(dirPath, ((month < 10) ? "0" : "") + month);
    this.ensureDirectory(dirPath);

    dirPath = path.join(dirPath, ((day < 10) ? "0" : "") + day);
    this.ensureDirectory(dirPath);

    return dirPath;
  },

  // fs utils
  ensureDirectory: function(dir) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync("" + dir);
    }
  },

  // host management
  normalizeHost: function(host) {
    var domain = tld.getDomain(host);
    if (config.useSubdomains[domain]) {
      return tld.getSubdomain(host) + "." + domain;
    }
    else {
      return domain;
    }
  },

  normalizeReverseHost: function(host) {
    host = host.replace(/^www\./, "");
    return host.split('').reverse().join('') + ".";
  },

  computeStringHash: function(str) {
    var md5 = crypto.createHash('md5').update(str || "").digest("hex");
    return Math.abs(hasher(md5));
  },

  removeHostTrailer: function(host, title) {
    var domain = tld.getDomain(host);
    if (!domain) return title;
    // extract the first name of the domain
    var trailer = domain.split('.')[0];
    var regex = new RegExp("[^A-Za-z0-9]*" + trailer + ".*$", "i");
    var cleansed = title.replace(regex, "");
    return cleansed;
  },

  mapTopicsToIAB: function(topics) {
    var cats = {};
    topics.forEach(function(topic) {
      var cat = MoreoverMap[topic];
      if (cat && RevMap[cat]) {
        RevMap[cat].forEach(function(name) {
          cats[name] = true;
        });
      }
    });
    return Object.keys(cats);
  },

};

module.exports = Utils;
