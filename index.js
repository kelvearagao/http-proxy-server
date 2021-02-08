const express = require("express");
const chalk = require("chalk");
const app = express();
const axios = require("axios");
const cors = require("cors");
const pathPatterns = require("./config/pathPatterns");

app.use(cors());

//console.log(pathPatterns);

Object.keys(pathPatterns).map((key) => {
  app.use(key, function (req, res, next) {
    const patthPattern = key;
    const config = pathPatterns[patthPattern];
    const toUrl =
      config.baseUrl +
      req.originalUrl.replace(
        config.pathPatternReplace.from,
        config.pathPatternReplace.to
      );

    const LOG = {
      REQ_PATTERN_REDIRECT: req.method + " " + patthPattern + " -> " + toUrl,
    };

    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    if ((config.response || {}).data) {
      console.log(chalk.yellow(LOG.REQ_PATTERN_REDIRECT));
      setTimeout(() => {
        res.status(config.response.status || 200).send(config.response.data);
      }, 5000);

      return;
    } else {
      console.log(LOG.REQ_PATTERN_REDIRECT);
    }

    console.log(req.headers);

    axios({
      method: req.method,
      url: toUrl,
      headers: {
        ...req.headers,
        host: null,
        //...config.headers,
      },
      data: {
        data: req.body,
      },
    })
      .then((result) => {
        console.log(
          chalk.green(
            result.status,
            result.statusText,
            JSON.stringify(result.data)
          )
        );

        res.format({
          [config.responseFormat]: function () {
            res.send(result.data);
          },
        });
        //console.log('==>', result.data)
      })
      .catch((err) => {
        console.log(chalk.red(err));

        if (err.response) {
          console.log(chalk.red("Data", JSON.stringify(err.response.data)));
        }

        if ((config.response || {}).data) {
          return res.send(config.response.data);
        }
        return res.status(200).end();
      });
  });
});

app.listen(3333);
