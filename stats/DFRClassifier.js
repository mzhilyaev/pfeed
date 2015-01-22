var fs = require("fs");
var urlParser = require("url");
var tld = require('tldjs');

var kNotWordPattern = /[^a-z0-9 ]+/g;
var kSplitter = /[\s-]+/;

function DFRClassifier(dfr, name) {
  this.dfr = dfr;
  this.name = name;
  this._urlStopwordSet = {};
};

DFRClassifier.prototype = {

  interestFinalizer: function(interests) {
    // This is a function to make the decision between a series of rules matched in the DFR
    // Accepts: an array containing either lists-of-strings, or lists-of-pairs where the pairs
    // are [string, float]
    // Returns: [string, string, ...]
    // Input: ["xyz",["golf",0.7],["foo",0.5],"bar"]

    var finalInterests = {};
    var highestWeight = 0;
    var bestWeightedInterest;
    interests.forEach(function(item) {
      if (Array.isArray(item)) {
        if (item[1] > highestWeight) {
          highestWeight = item[1];
          bestWeightedInterest = item[0];
        }
      } else {
        finalInterests[item] = true;
      }
    });
    if (bestWeightedInterest) finalInterests[bestWeightedInterest] = true;
    //log(JSON.stringify(interests));

    return Object.keys(finalInterests);
  },

  parseVisit: function(host, baseDomain, path, title, url, options) {
    // words object will contain terms and bigrams found in url and title
    var words = {};

    // this function populates words object with terms
    // it adds apropriate suffix (it case of host chunks)
    // or prefix (in case of paths) to the chunks supplied
    function addToWords(chunks, options) {
      options = options || {};
      var prev;
      var prefix = options.prefix || "";
      var suffix = options.suffix || "";
      var clearText = !(options.prefix == null && options.suffix == null) && options.clearText;

      for (var i in chunks) {
        if (chunks[i]) {
          words[prefix + chunks[i] + suffix] = true;
          if (clearText) {
            words[chunks[i]] = true;
          }
          if (prev) {
            // add bigram
            words[prefix + prev + chunks[i] + suffix] = true;
            if (clearText) {
              words[prev + chunks[i]] = true;
            }
          }
          prev = chunks[i];
        }
      }
    };

    // tokenize and add title chunks
    addToWords(this.tokenize(title), {suffix: "_t", clearText: true});
    // tokenize and add url chunks
    addToWords(this.tokenize(url), {suffix: "_u", clearText: true});
    // parse and add hosts chunks
    var hostChunks = host.substring(0, host.length - baseDomain.length)
                     .split(".")
                     .filter(function(item) {return item && item.length > 0;})
                     .reverse();
    addToWords(hostChunks, {suffix: "."});
    // add subdomains under __SCOPED keyword
    var scopedHosts = [baseDomain];
    var hostString = baseDomain;
    for (var i in hostChunks) {
      hostString = hostChunks[i].concat(".", hostString);
      scopedHosts.push(hostString);
    }
    // parse and add path chunks
    var pathChunks = path.split("/");
    for (var i in pathChunks) {
      addToWords(this.tokenize(pathChunks[i], ""), {prefix: "/"});
    }

    return [words, scopedHosts];
  },

  ruleClassify: function(host, baseDomain, path, title, url) {
    var interests = [];

    // check if rules are applicable at all
    if (!this.dfr || (!this.dfr[baseDomain] && !this.dfr["__ANY"])) {
      return interests;
    }

    // populate words object with visit data
    var ret = this.parseVisit(host, baseDomain, path, title, url);
    var words = ret[0];
    var scopedHosts = ret[1];

    // this funcation tests for exitence of rule terms in the words object
    // if all rule tokens are found in the wrods object return true
    function matchedAllTokens(tokens) {
      return tokens.every(function(token) {
        return words[token];
      });
    }

    // match a rule and collect matched interests
    function matchRuleInterests(rule) {
      Object.keys(rule).forEach(function(key) {
        if (key == "__HOME" && (path == null || path == "" || path == "/" || path.indexOf("/?") == 0)) {
          interests = interests.concat(rule[key]);
        }
        else if (key.indexOf("__") < 0 && matchedAllTokens(key.split(kSplitter))) {
          interests = interests.concat(rule[key]);
        }
      });
    }

    // __ANY rule does not support multiple keys in the rule
    // __ANY rule matches any single term rule - but not the term combination
    // as in "/foo bar_u baz_t"
    function matchANYRuleInterests(rule) {
      for (var key in words) {
        var ruleInts = rule[key];
        if (ruleInts) {
          interests = interests.concat(ruleInts);
        }
      }
    }

    // checks if any of the provided scoped hosts are white listed
    function isWhiteListed(hosts, whiteList) {
      for (var i in hosts) {
        if (whiteList.hasOwnProperty(hosts[i])) return true;
      }
      return false;
    }

    // process __ANY rule first
    if (this.dfr["__ANY"]) {
      matchANYRuleInterests(this.dfr["__ANY"]);
    }

    if (this.dfr["__SCOPES"]) {
      // dfr has scoped rules - check for scope domains and sub-domains
      // check if scopedHosts are white-listed in any of the __SCOPED rule
      // and if so apply the rule
      for (var i in this.dfr["__SCOPES"]) {
        // the scopedRule is of the form {"__HOSTS": {"foo.com", "bar.org"}, "__ANY": {... the rule...}}
        var scopedRule = this.dfr["__SCOPES"][i];
        if (isWhiteListed(scopedHosts, scopedRule["__HOSTS"])) {
          matchANYRuleInterests(scopedRule["__ANY"]);
          // we do not exect same page belong to two different genre
          break;
        }
      }
    }

    var domainRule = this.dfr[baseDomain];

    var keyLength = domainRule ? Object.keys(domainRule).length : 0;
    if (!keyLength)
      return this.interestFinalizer(interests);

    if (domainRule["__ANY"]) {
      interests = interests.concat(domainRule["__ANY"]);
      keyLength--;
    }

    if (!keyLength)
      return this.interestFinalizer(interests);

    matchRuleInterests(domainRule);

    return this.interestFinalizer(interests);
  },

  tokenize: function(aUrl, aTitle) {
    aUrl = aUrl.toLowerCase().replace(kNotWordPattern, " ");
    var tokens = [];
    var urlTokens = aUrl.split(/\s+/);
    urlTokens.forEach(function(token) {
      if (!this._urlStopwordSet.hasOwnProperty(token) && token != "") {
        tokens.push(token);
      }
    }, this);

    aTitle = (aTitle) ? aTitle.toLowerCase().replace(kNotWordPattern, " ") : "";
    tokens = tokens.concat(aTitle.split(/\s+/));

    return tokens;
  },

  classify: function(url, title) {
    var obj = urlParser.parse(url);
    var domain = tld.getDomain(obj.hostname);
    return this.ruleClassify(obj.hostname, domain, obj.pathname, title, url)
  },

};

module.exports = DFRClassifier;
