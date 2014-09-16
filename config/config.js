module.exports = {
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
