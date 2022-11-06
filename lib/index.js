const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const { JsonDB } = require("node-json-db");
const { Config } = require("node-json-db/dist/lib/JsonDBConfig");
const { createMainHander } = require("./core/handler");

let dynamicApiRouter = null;

function setupDynamicRouter({ pathPatterns, db }) {
  dynamicApiRouter = new express.Router();

  Object.keys(pathPatterns).map((key) => {
    dynamicApiRouter["use"](key, createMainHander({ key, pathPatterns, db }));
  });
}

const main = (conf) => {
  const PORT = conf.port || 3333;
  const pathPatterns = require(conf.routes);
  const dbName = conf.dbName || "cache-db";

  const db = new JsonDB(new Config(dbName, true, true, "/"));

  app.use(cors());
  app.use(bodyParser.json({ strict: false, limit: "1024mb" }));

  function initDynamicRoutes() {
    setupDynamicRouter({ pathPatterns, db });
    app.use("/", (req, res, next) => dynamicApiRouter(req, res, next));
  }

  // new router
  initDynamicRoutes();

  // old router
  // Object.keys(pathPatterns).map((key) => {
  //   // console.log("--> key", key);
  //   app.use(key, createMainHander({ key, pathPatterns, db }));
  // });

  app.get("/routes/:id", (req, res) => {
    console.log("-->", req.params);
    const key = Object.keys(pathPatterns).find(
      (key) => pathPatterns[key].id == req.params.id
    );

    res.send(pathPatterns[key]);
  });

  app.get("/routes", (req, res) => {
    res.send(pathPatterns);
  });

  app.get("/config", (req, res) => {
    res.send(require("./config/config"));
  });

  app.listen(PORT);
};

module.exports = {
  start: (conf) => {
    main(conf);
  },
};
