var fs = require("fs");
var path = require("path");
var tld = require('tldjs');
var config = require('../config/config');

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

};

module.exports = Utils;
