module.exports = {
  rootDir: "/Users/maximzhilyaev/pfeed",
  workDir: "work",
  download: {
    interval: 10000,
    docNumber: 100,
    outputDir: "download",
    url: "http://metabase.moreover.com/api/v10/articles",
    apiKey: "",
    database: "moreover",
  },
  docs: {
    database: "moreover",
    collection: "docs",
    uniqIndex: "id",
  },
  hosts: {
    database: "hosts",
    collection: "hosts",
  },
}
