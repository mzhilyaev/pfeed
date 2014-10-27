var config = {
  rootDir: "/Users/maximzhilyaev/pfeed",
  workDir: "work",
  mongo: {
    host: "localhost",
    port: 27017
  },
  download: {
    interval: 20000,
    seqIdFile: "seqId",
    docNumber: 500,
    outputDir: "download",
    hostsOutputDir: "hostDocs",
    runDir: "run",
    commandFile: "command",
    url: "http://metabase.moreover.com/api/v10/articles",
    apiKey: "",
    database: "moreover",
    drainInterval: 60000,
  },
  stats: {
    statsOutputDir: "webapp/public/stats",
  },
  useSubdomains: {
    "wordpress.com": true,
    "livejournal.com": true,
    "blogspot.com": true,
  },
  docs: {
    database: "moreover",
    collection: "docs",
  },
  hosts: {
    database: "moreover",
    collection: "hosts",
  },
}

function initConfig() {
  config.subRevHosts = [];
  config.subRevHostsMap = {};
  Object.keys(config.useSubdomains).forEach(function(domain) {
    var revHost = domain.split('').reverse().join('') + ".";
    config.subRevHosts.push(revHost);
    config.subRevHostsMap[revHost] = domain;
  });
};

initConfig();

module.exports = config;
