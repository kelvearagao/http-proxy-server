require("./lib/index").start({
  routes: __dirname + "/config/pathPatterns.js",
  port: 3333,
  dbName: "myDataBase",
  disableDB: true,
  disableLog: true,
});
