
var events = require("events");
var fs = require("fs");
var http = require("http");
var path = require("path");
var xml2js = require("xml2js");
var dateUtils = require("date-utils");
var zlib = require("zlib");
var LineStream = require('byline').LineStream;

var config = require("../config/config");
var utils = require("./Utils");

var Download = {

  emitter: new events.EventEmitter(),

  init: function() {
    this.workDir = path.join(config.rootDir, config.workDir);
    utils.ensureDirectory(this.workDir);
    this.idFile = path.join(this.workDir, config.download.seqIdFile);

    this.outputDir = path.join(this.workDir, config.download.outputDir);
    this.runDir = path.join(this.workDir, config.download.runDir);

    utils.ensureDirectory(this.outputDir);
    utils.ensureDirectory(this.runDir);

    this.commandFile = path.join(this.runDir, config.download.commandFile);

    this.downloadInterval = config.download.interval;
    this.setupPath();
    this.getLastSequenceId();
    // setup url
    this.url = config.download.url + "?limit=" + config.download.docNumber + "&key=" + config.download.apiKey;
    console.log(this.lastId);
    console.log(this.downloadPath);
  },

  setSkipFlag: function(val) {
    this.skip = val;
  },

  readCommands: function(cb) {
    if (fs.existsSync(this.commandFile)) {
      var input = fs.createReadStream(this.commandFile);
      var lineStream = new LineStream();
      lineStream.on('data', function(line) {
        this.emitter.emit("command", line);
      }.bind(this));
      lineStream.on('end', function() {
        fs.unlinkSync(this.commandFile);
        if (cb) cb();
      }.bind(this));
      input.pipe(lineStream);
    }
    else if(cb) cb();
  },

  checkDate: function() {
    if (Date.now() >= this.tomorrow) {
      this.setupPath(true);
    }
  },

  setupPath: function(force) {
    if (!this.downloadPath || force) {
      this.downloadPath  = utils.makeDateDirectory(this.outputDir);
      this.tomorrow = Date.tomorrow().getTime();
    }
  },

  getLastSequenceId: function() {
    if (!fs.existsSync(this.idFile)) {
      this.setLastSequenceId(0);
    }
    else {
      var id = fs.readFileSync(this.idFile + "", "utf8");
      this.lastId = parseInt(id);
    }
  },

  setLastSequenceId: function(newId) {
    fs.writeFileSync(this.idFile, newId + "", "utf8");
    this.lastId = newId;
  },

  start: function() {
    this.fireOne(100);
  },

  stop: function() {
    console.log("Stopping Downloads");
    this.pleaseStop = true;
  },

  isStopped: function() {
    return this.pleaseStop;
  },

  fireOne: function(interval) {
    if (this.pleaseStop) return;
    setTimeout(function() {
        this.readCommands(function() {
          this.checkDate();
          this.download();
          this.fireOne();
        }.bind(this));
    }.bind(this), interval || this.downloadInterval);
  },

  download: function() {
    if (this.pleaseStop || this.skip) {
      console.log("Skipping download...");
      return;
    }
    console.log("Starting download");
    var url = this.url + "&sequence_id=" + this.lastId;
    console.log(url);
    var savePath = path.join(this.downloadPath, "" + process.pid + "." + this.lastId + ".xml.gz");
    var saveFileStream = fs.createWriteStream(savePath);
    var gzipStream = zlib.createGzip();
    gzipStream.pipe(saveFileStream);
    saveFileStream.on('finish', function() {
      this.emitter.emit("saved-file", savePath);
    }.bind(this));

    var xmlBody = "";
    http.get( url, function (res) {
      console.log("Got response: " + res.statusCode);
      res.on("data", function(chunk) {
        gzipStream.write(chunk);
        xmlBody += chunk;
      });

      res.on("end", function() {
        gzipStream.end();

        // parse xml string
        xml2js.parseString(xmlBody, {explicitArray: false}, function (err, result) {
          if (err) {
            console.log("ERRORO " + err);
          } else {
            //console.log(JSON.stringify(result, null, 1));
            if (result.response.status == "FAILURE" || !result.response.articles) {
              console.log("bad response from moreover " + result.response.userMessage);
              return;
            }

            var arts = result.response.articles.article;
            var lastStory;
            if (Array.isArray(arts)) {
              lastStory = arts[arts.length-1];
            } else {
              lastStory = arts;
            }
            console.log(lastStory.sequenceId);
            this.setLastSequenceId(lastStory.sequenceId);
            this.emitter.emit("json", result);
          }
        }.bind(this));

      }.bind(this));
    }.bind(this)).on("error", function(e) {
      console.log("Got error: " + e.message);
    });

  },

  on: function(event, callback) {
    this.emitter.on(event, callback);
  },
};

module.exports = Download;
