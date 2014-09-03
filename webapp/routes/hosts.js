var docHelper = require("../../modules/DocHelper");
var hostTracker = require("../../modules/HostTracker");
var express = require('express');
var router = express.Router();

function getDocsForHost(req,res,host,seconds) {
  function handleResults(results) {
    res.json(results);
  };
  docHelper.getRecentDocsForSite(handleResults, host, seconds);
}

/*
 * GET resent docs for a host.
 */
router.get('/recentdocs/:host', function(req, res) {
  getDocsForHost(req, res, req.params.host, 0);
});

router.get('/recentdocs/:host/:seconds', function(req, res) {
  getDocsForHost(req, res, req.params.host, parseInt(req.params.seconds));
});

/*
 * POST host list to get resent docs for each host
 */
router.post('/recentdocs', function(req, res) {
  var searchObj = req.body;
  if (searchObj.hosts instanceof Array) {
    getDocsForHost(req, res, searchObj.hosts, searchObj.seconds || 0);
  }
  else {
    res.json({});
  }
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

module.exports = router;
