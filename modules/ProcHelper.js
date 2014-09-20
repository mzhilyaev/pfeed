var fs = require("fs");
var path = require("path");
var config = require("../config/config");
var utils = require("./Utils");

var ProcHelper = {
  setup: function() {
    this.workDir = path.join(config.rootDir, config.workDir);
    utils.ensureDirectory(this.workDir);
    this.runDir = path.join(this.workDir, config.download.runDir);
    this.procFile = path.join(this.runDir, path.basename(process.argv[1], ".js"));
    var fileFd = fs.openSync(this.procFile, "w");
    fs.writeSync(fileFd, "" + process.pid);
    fs.closeSync(fileFd);
  },

  cleanup: function() {
    fs.unlinkSync(this.procFile);
  },
};

ProcHelper.setup();
process.on('exit', function() {
  ProcHelper.cleanup();
});
