var fs = require("fs");

function StatsCollector() {
  this.catStats = {};
};

StatsCollector.prototype = {
  // adds results of classification to catStats
  add: function(domain, ruleSet, expected, assigned) {
    if (!this.catStats["ANY"]) this.catStats["ANY"] = {};
    this.addToStatsObj(this.catStats["ANY"], ruleSet, expected, assigned);
    // skip domain statistics for now
    //if (!this.catStats[domain]) this.catStats[domain] = {};
    //addToStatsObj(this.catStats[domain], ruleSet, expected, assigned);
  },

  // adds results of classification to a single stats object
  addToStatsObj: function(stats, ruleSet, expected, assigned) {
    if (!stats[ruleSet]) {
      stats[ruleSet] = {};
    }
    var statsObj = stats[ruleSet];   // stats object
    var eCats = {};  // expected cats map
    var aCats = {};  // assigned cats map

    // makes an empty object of cat statistics
    function makeCatStats() {
      return {
        seen: 0,     // expected total count
        assigned: 0, // assigned total count
        correct: 0,  // assigned correct count
      };
    }

    // populate expected cats maps and update seen count
    expected.forEach(function(cat) {
      eCats[cat] = true;
      if (!statsObj[cat]) statsObj[cat] = makeCatStats();
      statsObj[cat].seen++;
    });

    // process assigned categories
    assigned.forEach(function(cat) {
      if (aCats[cat]) return;  // do not allow duplicates
      if (!statsObj[cat]) statsObj[cat] = makeCatStats();

      statsObj[cat].assigned++;  // update total assinged count
      if (eCats[cat]) statsObj[cat].correct++; // update correct count
      aCats[cat] = true; // mark category as processed
    });
  },

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
          var precision = (catStats.assigned) ? catStats.correct / catStats.assigned : "?";
          var recall = (catStats.seen) ? catStats.correct / catStats.seen : 0;
          console.log("  ", cat, precision, recall);
        });
      });
    }
  },
};

module.exports = StatsCollector;
