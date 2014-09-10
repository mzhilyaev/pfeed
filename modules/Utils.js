var fs = require("fs");
var path = require("path");

var Utils = {

  // Date Utils
  makeDateDirectory: function(root) {
    var dt = new Date();
    var year = dt.getUTCFullYear();
    var month = dt.getUTCMonth();
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

};

module.exports = Utils;
