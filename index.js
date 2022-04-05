const express = require("express");
const chalk = require("chalk");
const app = express();
const axios = require("axios");
const cors = require("cors");
const bodyParser = require('body-parser')
const pathPatterns = require("./config/pathPatterns");

app.use(cors());
app.use(bodyParser.json({ strict: false }))

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
      data: isNaN(req.body) ? req.body : (req.body||'').toString()
    })
      .then((result) => {
        if (config.showLog.successResponse) {
          console.log(
            chalk.green(
              '[RESPONSE]', 
              LOG.REQ_PATTERN_REDIRECT,
              result.status,
              result.statusText,
            )
          );
          console.log(
            chalk.gray(
              JSON.stringify(result.data)
            )
          )
        }
        
        return res.status(result.status).send(result.data);
        
        // res.format({
        //   [config.responseFormat]: function () {
        //     res.status(result.status).send(result.data);
        //   },
        // });
      })
      .catch((err) => {
        console.log(chalk.red('[RESPONSE ERROR]', LOG.REQ_PATTERN_REDIRECT));
        console.log(config.pathPatternReplace);
        
        if (err.response) {
          console.log(chalk.gray("Data", JSON.stringify(err.response.data), err.response.status));
        } else {
          console.log(chalk.gray(err));
        }

        if ((config.response || {}).data) {
          return res.status((config.response ||{}).status).send(config.response.data);
        }

        if ((err.response||{}).status) {
          return res.status((err.response||{}).status).send(err.response.data);
        }

        return res.status(200).end();
      });
  });
});

app.listen(3333);
