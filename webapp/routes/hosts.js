var when = require("when");
var docHelper = require("../../modules/DocHelper");
var hostTracker = require("../../modules/HostTracker");
var hostKeeper = require("../../modules/HostKeeper");
var utils = require("../../modules/Utils");
var express = require('express');
var router = express.Router();

function getDocsForHost(req, res, search) {
  function handleResults(results) {
    // if nothing was found, then the host should be inseted
    // to start the drain
    if (Object.keys(results).length == 0) {
      hostTracker.insertHosts(search.host);
    }
    res.json(results);
  };
  docHelper.getRecentDocsForSite(handleResults, search);
}

/*
 * GET recent docs for a host.
 */
router.get('/recentdocs/:host', function(req, res) {
  getDocsForHost(req, res, {host: req.params.host});
});

router.get('/recentdocs/:host/:sequenceId', function(req, res) {
  getDocsForHost(req, res, {host: req.params.host, sequenceId: parseInt(req.params.sequenceId)});
});

/*
 * Get stats for a host
 */
router.get('/stats/:host', function(req, res) {
  res.redirect("/public/stats/" + utils.normalizeHost(req.params.host));
});

/*
 * POST host list to get resent docs for each host
 */
router.post('/recentdocs', function(req, res) {
  var searchObj = req.body;
  getDocsForHost(req, res, searchObj);
});

/*
 * POST report top domains
 */
router.post('/tophosts', function(req, res) {
  var topHosts = req.body;
  hostTracker.insertHosts(topHosts, function() {
    res.end();
  });
});

/*
 * POST request for top domains info
 */
router.post('/tophosts/info', function(req, res) {
  var topHosts = req.body;
  res.json(hostKeeper.getHostInfo(topHosts));
});

/*
 * POST request for domain documents
 */
router.post('/tophosts/history', function(req, res) {
  var host = req.body.host;
  hostKeeper.getHostDocs(
    req.body.host,
    req.body.hashes,
    function(results) {
      res.json(results);
    }
  );
});

router.post('/tophosts/history/titles', function(req, res) {
  var host = req.body.host;
  console.log(JSON.stringify(req.body));
  hostKeeper.getHostDocsClearTitles(
    req.body.host,
    req.body.titles,
    function(results) {
      res.json(results);
    }
  );
});


module.exports = router;
