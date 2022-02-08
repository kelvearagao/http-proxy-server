const express = require("express");
const chalk = require("chalk");
const app = express();
const axios = require("axios");
const cors = require("cors");
const bodyParser = require('body-parser')
const pathPatterns = require("./config/pathPatterns");

app.use(cors());
app.use(bodyParser.json())

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
      console.log(chalk.yellow('[MOCK]', LOG.REQ_PATTERN_REDIRECT));
      setTimeout(() => {
        res.status(config.response.status || 200).send(config.response.data);
      }, 1000);

      return;
    } else {
      console.log('[PROXY]', LOG.REQ_PATTERN_REDIRECT);
    }

    //console.log(req.headers);
    //console.log(config.headers);
   
    let newHeaders = {
      ...req.headers,
      // connection: null,
      // 'content-length': null,
      host: null,
      // 'accept-encoding': null,
      // 'user-agent': null,
      // referer: null,
      // 'sec-ch-ua': null,
      // 'sec-ch-ua-mobile': null,
      // 'content-type': null,
      // accept: null,
      // 'sec-ch-ua-platform': null,
      origin: null,
      // 'sec-fetch-site': null,
      // 'sec-fetch-mode': null,
      // 'sec-fetch-dest': null,
      // 'accept-language': null,
      ...config.headers,
    }

    newHeaders = (Object.keys(newHeaders).reduce((acc, key) => {
      if (newHeaders[key] !== null) {
        acc[key] = newHeaders[key]
      }

      return acc
    }, {}))

    //console.log('new ', newHeaders)

    axios({
      method: req.method,
      url: toUrl,
      headers: {
        ...newHeaders
      },
      data: req.body
    })
      .then((result) => {
        // console.log(
        //   chalk.green(
        //     result.status,
        //     result.statusText,
        //     JSON.stringify(result.data)
        //   )
        // );

        res.format({
          [config.responseFormat]: function () {
            res.send(result.data);
          },
        });
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
