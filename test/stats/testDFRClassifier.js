'use strict';
var should = require('should');
var when = require("when");
var DFRClassifier = require('../../stats/DFRClassifier');

var testDomainRules = {
  "mozilla.org" : {
    "__ANY" : [
      "computers"
    ]
  },
  "noaa.gov" : {
    "nws." : [
      "government",
      "weather",
      "science",
    ]
  },
  "news.com" : {
    "__HOME" : [
      "news_home"
    ],
    "__ANY" : [
      "news"
    ]
  },
  "testpathdomain.com" : {
    "/code": [
      "programming"
    ],

    "/code cplusplus": [
      "oop"
    ],
  },
  "stack.com": {
    "/code /js": [
      "js"
    ]
  },
  "google.com" : {
    "app.": [
      "app"
    ],
    "/realestate": [
      "real estate"
    ],
  },
  "__ANY" : {
    "/golf": [
      "golf",
    ],
    "golf.": [
      ["tiger", 0.7],
      ["foo", 0.5],
    ],
    "frontline": [
      "test"
    ],
    "/politics": [
       "politics"
    ],
    "foo_u": [
       "foo"
    ],
    "bar_t": [
       "bar"
    ],
  },
  "__SCOPES": [
    {
      "__HOSTS": {
        "blast.com": true,
        "heavy.blast2.com": true,
        "super.heavy.blast3.com": true,
      },
      "__ANY": {
          "ebola_t": [ "science"],
      },
    },
    {
      "__HOSTS": {
        "blast4.com": true,
      },
      "__ANY": {
          "bank_t": [ "banking"],
      },
    },
  ],
};

var matchTests = [
{
  info: "Match Test 1 (Rules): mozilla.org",
  url:  "http://www.mozilla.org",
  title: "Hello World",
  expectedInterests:  ["computers"],
},
{
  info: "Match Test 2 (Rules): weather gov",
  url:  "http://nws.noaa.gov",
  title: "Hello World",
  expectedInterests:  ["government","weather","science"],
},
{
  info: "Match Test 3 (Rules): mail.google.com example",
  url:  "https://mail.google.com/mail/u/0/?ui=2&shva=1#inbox?compose=13e0005db4a0d0d4",
  title: "",
  expectedInterests: [],
},
{
  info: "Match Test 4 (Rules): www.news.com home url",
  url:  "https://www.news.com",
  title: "",
  expectedInterests: ["news","news_home"],
},
{
  info: "Match Test 5 (Rules): www.news.com page url",
  url:  "https://www.news.com/page_url",
  title: "",
  expectedInterests: ["news"],
},
{
  info: "Match Test 6 (Rules): www.news.com query url",
  url:  "https://www.news.com?page=1",
  title: "",
  expectedInterests: ["news","news_home"],
},
{
  info: "Match Test 7 (Rules): www.testpathdomain.com query url",
  url:  "https://www.testpathdomain.com/CODE?qw=aa",
  title: "CPlusPlus programming",
  expectedInterests: ["programming","oop"],
},
{
  info: "Match Test 8 (Rules): www.stack.com query url",
  url:  "https://www.stack.com/code/js?qw=aa",
  title: "js programming",
  expectedInterests: ["js"],
},
{
  info: "Match Test 9 (Rules): __ANY golf",
  url:  "https://www.stack.com/golf/js?qw=aa",
  title: "js programming",
  expectedInterests: ["golf"],
},
{
  info: "Match Test 10 (Rules): .app",
  url:  "https://app.dev.google.com/",
  title: "js programming",
  expectedInterests: ["app"],
},
{
  info: "Match Test 11 (Rules): real_estate",
  url:  "https://dev.google.com/real_estate/",
  title: "js programming",
  expectedInterests: ["real estate"],
},
{
  info: "Match Test 12 (Rules): golf subdomain",
  url:  "https://golf.google.com/golf",
  title: "tornament",
  expectedInterests: ["golf","tiger"],
},
{
  info: "Match Test 13 (Rules): frontline bigram",
  url:  "https://google.com",
  title: "front line",
  expectedInterests: ["test"],
},
{
  info: "Match Test 13 (Rules): frontline bigram",
  url:  "http://us.cnn.com/2014/11/16/politics/g20-summit-putin/index.html?hpt=hp_inthenews",
  title: "G20 summit",
  expectedInterests: ["politics"],
},
{
  info: "Match Test 14 (Rules): foo in URL",
  url:  "http://us.cnn.com/2014/11/16/foo/xyz",
  title: "G20 summit",
  expectedInterests: ["foo"],
},
{
  info: "Match Test 15 (Rules): bar in title",
  url:  "http://us.cnn.com/xxx",
  title: "G20 bar summit",
  expectedInterests: ["bar"],
},
{
  info: "Match Test 16 (Rules): scoped rule application",
  url:  "http://little.blast.com",
  title: "ebola rules",
  expectedInterests: ["science"],
},
{
  info: "Match Test 17 (Rules): scoped rule application",
  url:  "http://little.blast3.com",
  title: "ebola rules",
  expectedInterests: [],
},
{
  info: "Match Test 18 (Rules): scoped rule application",
  url:  "http://heavy.blast2.com",
  title: "ebola rules",
  expectedInterests: ["science"],
},
{
  info: "Match Test 19 (Rules): scoped rule application",
  url:  "http://super.heavy.blast3.com",
  title: "ebola rules",
  expectedInterests: ["science"],
},
{
  info: "Match Test 20 (Rules): scoped rule application",
  url:  "http://super.heavy.blast4.com",
  title: "bank rules",
  expectedInterests: ["banking"],
},
];

describe('test DFR', function(){
  it('test DFR', function(done) {
    var dfr = new DFRClassifier(testDomainRules, "testDFR");
    matchTests.forEach(function(test) {
      var interests = dfr.classify(test.url, test.title);
      should(interests).eql(test.expectedInterests);
    });
    done();
  });
});
