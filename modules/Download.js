
var events = require("events");
var fs = require("fs");
var http = require("http");
var path = require("path");
var http = require("http");
var xml2js = require("xml2js");
var dateUtils = require("date-utils");

var config = require("../config/config");
var utils = require("./Utils");

var Download = {

  emitter: new events.EventEmitter(),

  init: function() {
    this.idFile = path.join(config.rootDir, config.workDir, config.download.seqIdFile);
    this.outputDir = path.join(config.rootDir, config.workDir, config.download.outputDir);
    this.downloadInterval = config.download.interval;
    this.setupPath();
    this.getLastSequenceId();
    // setup url
    this.url = config.download.url + "?limit=" + config.download.docNumber + "&key=" + config.download.apiKey;
    console.log(this.lastId);
    console.log(this.downloadPath);
    this.start();
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
    this.pleaseStop = true;
  },

  fireOne: function(interval) {
    if (this.pleaseStop) return;
    setTimeout(function() {
        this.checkDate();
        this.download();
        console.log("call to download");
    }.bind(this), interval || this.downloadInterval);
  },

  download: function() {
    if (this.pleaseStop) return;
    var url = this.url + "&sequence_id=" + this.lastId;
    console.log(url);
    var savePath = path.join(this.downloadPath, "" + process.pid + "." + this.lastId + ".xml");
    var saveFile = fs.openSync(savePath, "w");
    var xmlBody = "";
    http.get( url, function (res) {
      console.log("Got response: " + res.statusCode);
      res.on("data", function(chunk) {
        fs.writeSync(saveFile, chunk, 0, chunk.length);
        xmlBody += chunk;
      });

      res.on("end", function() {
        console.log("ending");
        fs.closeSync(saveFile);
        this.emitter.emit("saved-file", savePath);

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
            var firstStory;
            if (Array.isArray(arts)) {
              firstStory = arts[0];
            } else {
              firstStory = arts;
            }
            console.log(firstStory.sequenceId);
            this.setLastSequenceId(firstStory.sequenceId);
            this.emitter.emit("json", result);
          }
        }.bind(this));

      }.bind(this));
    }.bind(this)).on("error", function(e) {
      console.log("Got error: " + e.message);
    });

    this.fireOne();
  },

  on: function(event, callback) {
    this.emitter.on(event, callback);
  },
};

module.exports = Download;
