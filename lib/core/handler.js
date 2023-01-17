const axios = require("axios");
const chalk = require("chalk");
const { v4: uuidv4 } = require("uuid");

const createMainHander = ({ key, pathPatterns, db }) => {
  return function mainHandler(req, res, next) {
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

    if (
      (config.forceProxy !== true && (config.response || {}).data) ||
      config.mock.isActive === true
    ) {
      console.log(chalk.yellow("[MOCK]", LOG.REQ_PATTERN_REDIRECT));

      if ((config.response || {}).data) {
        console.log(chalk.gray("...from config response data"));
        setTimeout(() => {
          res.status(config.response.status || 200).send(config.response.data);
        }, config.response.timeout || 500);

        return;
      }

      const mockResponse = db
        .getData("/responses")
        .find((item) => item.request.url === toUrl);

      if (mockResponse) {
        console.log(chalk.gray("...first occurrence on mock db"));
        setTimeout(() => {
          res.set("Response-ID", mockResponse.id);
          res
            .status(mockResponse.response.status)
            .send(mockResponse.response.data);
        }, 500);

        return;
      }
    } else {
      console.log("[PROXY]", LOG.REQ_PATTERN_REDIRECT);
    }

    if (config.showLog.reqHeaders) {
      console.log("eq.headers", req.headers);
    }

    if (config.showLog.configHeaders) {
      console.log("config.headers", config.headers);
    }

    let newHeaders = {
      ...req.headers,
      // connection: null,
      // 'content-length': null,
      host: null,
      "accept-encoding": null,
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
    };

    newHeaders = Object.keys(newHeaders).reduce((acc, key) => {
      if (newHeaders[key] !== null) {
        acc[key] = newHeaders[key];
      }

      return acc;
    }, {});

    if (config.showLog.newHeaders) {
      console.log("new newHeaders", newHeaders);
    }

    const requestData = isNaN(req.body)
      ? req.body
      : (req.body || "").toString();

    axios({
      method: req.method,
      url: toUrl,
      headers: {
        ...newHeaders,
      },
      data: requestData,
    })
      .then((result) => {
        const id = uuidv4();

        if (config.showLog.successResponse) {
          console.log(
            chalk.green(
              "[RESPONSE]",
              LOG.REQ_PATTERN_REDIRECT,
              result.status,
              result.statusText
            )
          );
          console.log(
            chalk.gray("Response Id", id, JSON.stringify(result.data))
          );
        }

        if (config.saveOnDB !== false) {
          console.log(chalk.gray("Saving response on DB: Id", id));

          db.push("/responses[]", {
            id,
            patthPattern,
            request: {
              url: toUrl,
              method: req.method,
              headers: newHeaders,
              data: requestData,
            },
            response: {
              status: result.status,
              data: result.data,
            },
            createdAt: new Date().toISOString(),
          });
        }

        return res
          .header("Response-ID", id)
          .status(result.status)
          .send(result.data);

        // res.format({
        //   [config.responseFormat]: function () {
        //     res.status(result.status).send(result.data);
        //   },
        // });
      })
      .catch((err) => {
        console.log(chalk.red("[RESPONSE ERROR]", LOG.REQ_PATTERN_REDIRECT));

        console.log("error message", err.message);
        //return res.status(200).end();
        if (err.response) {
          console.log(
            chalk.gray(
              "Data",
              JSON.stringify(err.response.data),
              err.response.status
            )
          );
        } else {
          console.log(chalk.gray(err));
        }

        if (config.forceProxy) {
          return res.status(err.response.status).send(err.response.data);
        }

        if (!config.forceProxy && (config.response || {}).data) {
          return res
            .status((config.response || {}).status)
            .send(config.response.data);
        }

        if (!config.forceProxy && (err.response || {}).status) {
          return res
            .status((err.response || {}).status)
            .send(err.response.data);
        }

        return res.status(200).end();
      });
  };
};

module.exports = {
  createMainHander,
};
