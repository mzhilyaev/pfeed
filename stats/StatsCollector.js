var fs = require("fs");

function StatsCollector() {
  this.catStats = {};
};

StatsCollector.prototype = {
  // adds results of classification to catStats
  add: function(domain, ruleSet, expected, categorized) {
    if (!this.catStats["ANY"]) this.catStats["ANY"] = {};
    this.addToStatsObj(this.catStats["ANY"], ruleSet, expected, categorized);
    // skip domain statistics for now
    //if (!this.catStats[domain]) this.catStats[domain] = {};
    //addToStatsObj(this.catStats[domain], ruleSet, expected, categorized);
  },

  // adds results of classification to a single stats object
  addToStatsObj: function(stats, ruleSet, expected, categorized) {
    if (!stats[ruleSet]) {
      stats[ruleSet] = {};
    }
    var statsObj = stats[ruleSet];   // stats object
    var eCats = {};  // expected cats map
    var aCats = {};  // categorized cats map

    // makes an empty object of cat statistics
    function makeCatStats() {
      return {
        total: 0,     // expected total count
        categorized: 0, // categorized total count
        correct: 0,  // categorized correct count
      };
    }

    // populate expected cats maps and update total count
    expected.forEach(function(cat) {
      eCats[cat] = true;
      if (!statsObj[cat]) statsObj[cat] = makeCatStats();
      statsObj[cat].total++;
    });

    // process categorized categories
    categorized.forEach(function(cat) {
      if (aCats[cat]) return;  // do not allow duplicates
      if (!statsObj[cat]) statsObj[cat] = makeCatStats();

      statsObj[cat].categorized++;  // update total assinged count
      if (eCats[cat]) statsObj[cat].correct++; // update correct count
      aCats[cat] = true; // mark category as processed
    });
  },

  // output function
  output: function() {
    var domains = Object.keys(this.catStats);
    for (var i in domains) {
      var ruleSetsObject = this.catStats[domains[i]];
      console.log("Domain: " + domains[i]);
      Object.keys(ruleSetsObject).forEach(function(ruleSet) {
        console.log(" " + ruleSet);
        var cats = Object.keys(ruleSetsObject[ruleSet]).sort();
        cats.forEach(function(cat) {
          var catStats = ruleSetsObject[ruleSet][cat];
          var precision = (catStats.categorized) ? catStats.correct / catStats.categorized : "?";
          var recall = (catStats.total) ? catStats.correct / catStats.total : 0;
          console.log("  ", cat, precision, recall);
        });
      });
    }
  },
};

module.exports = StatsCollector;
