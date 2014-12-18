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
      stats[ruleSet] = {
        OVERALL: makeCatStats(),
        OVERALL_SUB: makeCatStats(),
      };
      stats[ruleSet].OVERALL.correctSeenCount = 0;
      stats[ruleSet].OVERALL_SUB.correctSeenCount = 0;
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

    // if expcted cats exist bump the OVERALL count
    if (expected.length > 0) {
      statsObj.OVERALL.total ++;
    }

    // populate expected cats maps and update total count
    var subSeen = false;
    expected.forEach(function(cat) {
      eCats[cat] = true;
      if (!statsObj[cat]) statsObj[cat] = makeCatStats();
      if (cat.match("/")) subSeen = true;
      statsObj[cat].total++;
    });

    if (subSeen) {
      statsObj.OVERALL_SUB.total++;
    }

    // process categorized categories
    var overallCorrectSeen = false;
    var overallSubCorrectSeen = false;
    categorized.forEach(function(cat) {
      if (aCats[cat]) return;  // do not allow duplicates
      if (!statsObj[cat]) statsObj[cat] = makeCatStats();
      var isSub = cat.match("/");

      statsObj.OVERALL.categorized ++;
      if (isSub) {
        statsObj.OVERALL_SUB.categorized ++;
      }
      statsObj[cat].categorized++;  // update total assinged count
      if (eCats[cat]) {
        statsObj[cat].correct++; // update correct count
        statsObj.OVERALL.correct++;
        overallCorrectSeen = true;
        if (isSub) {
          statsObj.OVERALL_SUB.correct++
          overallSubCorrectSeen = true;
        }
      }
      aCats[cat] = true; // mark category as processed
    });

    if (overallCorrectSeen) {
      statsObj.OVERALL.correctSeenCount++;
    }

    if (overallSubCorrectSeen) {
      statsObj.OVERALL_SUB.correctSeenCount++;
    }

  },

  // output function
  output: function() {
    var domains = Object.keys(this.catStats);
    for (var i in domains) {
      var domain = domains[i];
      var ruleSetsObject = this.catStats[domain];
      Object.keys(ruleSetsObject).forEach(function(ruleSet) {
        var cats = Object.keys(ruleSetsObject[ruleSet]).sort();
        cats.forEach(function(cat) {
          var catStats = ruleSetsObject[ruleSet][cat];
          var precision = (catStats.categorized) ? catStats.correct / catStats.categorized : "NULL";
          var recall = (catStats.total) ? catStats.correct / catStats.total : 0;
          if (cat == "OVERALL" || cat == "OVERALL_SUB") {
            recall = (catStats.total) ? catStats.correctSeenCount / catStats.total : 0;
          }
          console.log("'%s','%s','%s',%s,%s,%s",domain, ruleSet, cat, precision, recall, catStats.total);
        });
      });
    }
  },
};

module.exports = StatsCollector;
