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
        OVERALL_TOP: makeCatStats(),
      };
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
        correctSeenCount: 0, // for OVERALL recall computation
      };
    }

    // if expcted cats exist bump the OVERALL count
    if (expected.length > 0) {
      statsObj.OVERALL.total ++;
      statsObj.OVERALL_TOP.total ++;
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
      else {
        statsObj.OVERALL_TOP.categorized ++;
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
        else {
          statsObj.OVERALL_TOP.correct++
        }
      }
      aCats[cat] = true; // mark category as processed
    });

    if (overallCorrectSeen) {
      statsObj.OVERALL.correctSeenCount++;
      statsObj.OVERALL_TOP.correctSeenCount++;
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
          var precision = (catStats.categorized) ? Math.round(catStats.correct * 100/ catStats.categorized) : -1;
          var recall = (catStats.total) ? Math.round(catStats.correct * 100 / catStats.total) : 0;
          if (cat.match("OVERALL")) {
            // special case recall computation for OVERALL cats
            recall = (catStats.total) ? Math.round(catStats.correctSeenCount * 100 / catStats.total) : 0;
          }
          // remove ',' from cat
          cat = cat.replace(",","");
          console.log("%s,%s,%s,%s,%s,%s",domain, ruleSet, cat, precision, recall, catStats.total);
        });
      });
    }
  },
};

module.exports = StatsCollector;
