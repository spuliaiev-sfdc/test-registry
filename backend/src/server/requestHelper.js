const
  fs = require('fs'),
  http = require('http'),
  utils = require('./corUtils.js'),
  micromatch = require('micromatch');

const requestHelper = {

    // Matches the headers and body of the request. For headers the patterns could be used :
    // https://github.com/micromatch/micromatch
    // For example:
    // Matching features
    // Support for multiple glob patterns (no need for wrappers like multimatch)
    // Wildcards (**, *.js)
    // Negation ('!a/*.js', '*!(b).js'])
    // extglobs (+(x|y), !(a|b))
    // POSIX character classes ([[:alpha:][:digit:]])
    // brace expansion (foo/{1..5}.md, bar/{a,b,c}.js)
    // regex character classes (foo-[1-5].js)
    // regex logical "or" (foo/(abc|xyz).js)
    isRequestMatching(matchTo, existing) {
      if (matchTo.headers) {
        for (let headerName in matchTo.headers) {
          try {
            if (!micromatch.isMatch(existing.headers[headerName], matchTo.headers[headerName])) {
              return false;
            }
          } catch (e) {
            return false;
          }
        }
      }
      // Verify body
      if (matchTo.body) {
        return matchTo.headers["content-type"].startsWith("application/json") &&
          utils.compareObjects(JSON.parse(matchTo.body), existing.body);
      }
      return true;
    },

    findMatching(req) {
      const forApi = req.method + ":" + req.url;
      let targets = [];
      let mappedTargets = mapping[forApi];
      if (mappedTargets) {
        targets = [...mappedTargets];
      }

      let proxifiedTargets = proxyfiedMapping[forApi];
      if (proxifiedTargets) {
        targets = [...targets, ...proxifiedTargets];
      }

      let matchingTargets = [];

      targets.forEach(target => {
        if (target.match) {
          // need to do a match between request and provided pattern
          if (requestHelper.isRequestMatching(target.match, req)) {
            matchingTargets.push(target);
          }
        } else {
          matchingTargets.push(target);
        }
      });

      return matchingTargets;
    },


    renderHeaders(headers) {
      let headersString = "";
      for (let field in headers) {
        headersString += `${field}:${headers[field]}\n`;
      }
      return headersString;
    },

    saveProxifiedResponseFile(req, creq, cres, rawData, proxifiedRequest) {
      try {
        let content = `\n\nRESPONSE:\n${req.method} ${creq.path}\nStatusCode:${cres.statusCode}\n${requestHelper.renderHeaders(cres.headers)}\n\n${rawData}`;
        fs.writeFileSync(proxifiedRequest.finalFilePath, content, {flag: 'a'});
      } catch (e) {
        console.log(`Failed to record the proxied call ${e}`)
      }
    },

    saveProxifiedMapping(req, creq, cres, rawData, proxifiedRequest) {
      try {
        // save the proxified mapping in memory
        let requests = proxyfiedMapping[proxifiedRequest.forApi];
        if (!requests) {
          requests = [];
          proxyfiedMapping[proxifiedRequest.forApi] = requests;
        }

        let request = {
          "match": {
            "body": proxifiedRequest.requestContent,
            "headers": {
              "content-type": req.headers["content-type"]
            }
          },
          "headers": {
            "content-type": cres.headers["content-type"],
          },
          "type": "text",
          "text": rawData
        };
        requests.push(request);

        saveProxifiedMappingFile();
      } catch (e) {
        console.log(`Failed to record the proxied call ${e}`)
      }
    },

    saveProxifiedRequestFile(req, bodyContent) {
      let fullProxyFolderPath = path.join(process.cwd(), proxyFolderPath);
      let filename = req.url.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      let index = 0;
      let finalFileName = null;
      let finalFilePath = null;
      do {
        index++;
        let indexStr = `${index}`.padStart(3, '0');
        finalFileName = `${filename}_${indexStr}.json`;
        finalFilePath = path.join(fullProxyFolderPath, finalFileName);
      } while (fs.existsSync(finalFilePath));

      let content = `REQUEST:\n${req.method} ${req.url}\n${renderHeaders(req.headers)}\n\n${bodyContent}`;
      fs.writeFileSync(finalFilePath, content);

      const forApi = req.method + ":" + req.url;
      return {
        'folderPath': fullProxyFolderPath,
        'finalFilePath': finalFilePath,
        'finalFileName': finalFileName,
        'index': index,
        'filename': filename,
        'forApi': forApi,
        'requestContent': bodyContent
      };
    },

    processProxyRequest(req, res, next) {
      let content = req.body;
      if (typeof content === 'object') {
        content = JSON.stringify(content, null, 2);
      }
      let proxifiedRequestFile = null;
      if (args.r || req.headers["backsim-record"] === "true") {
        proxifiedRequestFile = requestHelper.saveProxifiedRequestFile(req, content);
      }

      const options = {
        hostname: 'localhost',
        port: 8060,
        path: req.url,
        method: req.method,
        headers: req.headers
      };

      // Fix the Content Length
      options.headers['Content-Length'] = Buffer.byteLength(content);
      options.headers['content-length'] = Buffer.byteLength(content);

      let creq = http.request(options, function (cres) {

        // set encoding
        cres.setEncoding('utf8');

        // wait for data
        let rawData = '';
        cres.on('data', function (chunk) {
          console.log(`BODY: ${chunk}`);
          rawData += chunk;
        });

        cres.on('close', function () {
          // closed, let's end client request as well
          console.log('Closed response.');
          if (!res.finished) {
            res.writeHead(cres.statusCode);
            res.end();
          }
        });

        cres.on('end', function () {
          // finished, let's finish client request as well
          console.log('No more data in response.');
          cres.headers['BackSim-proxified'] = true;
          cres.headers['BackSim-matched'] = false;
          if (proxifiedRequestFile) {
            cres.headers['BackSim-filename'] = proxifiedRequestFile.finalFileName;
            saveProxifiedResponseFile(req, creq, cres, rawData, proxifiedRequestFile);

            if (cres.statusCode === 200 || args.f) {
              cres.headers['BackSim-recorded'] = true;
              saveProxifiedMapping(req, creq, cres, rawData, proxifiedRequestFile);
            } else {
              cres.headers['BackSim-recorded'] = false;
              console.log("Request failed and will not be recorded");
            }
          } else {
            cres.headers['BackSim-recorded'] = false;
          }
          res.writeHead(cres.statusCode, cres.headers);
          res.write(rawData);
          res.end();
        });

      }).on('error', function (e) {
        // we got an error, return 500 error to client and log error
        console.error(`problem with request: ${e.message}`);
        res.writeHead(500);
        res.end();
      });

      // Write data to request body
      creq.write(content);
      creq.end();

    }
    ,

    processFoundRequest(req, res, next, target) {
      if (Array.isArray(target)) {
        for (i = 0; i < target.length; i++) {
          if (processFoundRequest(req, res, next, target[i])) {
            return true;
          }
        }
        return false;
      }
      res.set('BackSim-recorded', false);
      res.set('BackSim-proxified', false);
      res.set('BackSim-matched', true);

      if (target.type === "file") {
        requestHelper.respondWithFileContent(target.headers, target.path, res);
        return true;
      }
      if (target.type === "text") {
        requestHelper.respondWithHeaders(target.headers, target.text, res);
        return true;
      }
    },

    respondWithHeaders(headers, content, httpResponse) {
      if (headers) {
        for (let headerName in headers) {
          httpResponse.set(headerName, headers[headerName]);
        }
      }
      httpResponse.send(content);
    },

    respondWithFileContent(headers, relativeFilePath, httpResponse) {
      let filePath = path.join(process.cwd(), folderPath);
      filePath = path.join(filePath, relativeFilePath);
      const content = fs.readFileSync(filePath, "UTF-8");
      requestHelper.respondWithHeaders(headers, content, httpResponse);
    },

    processAdminRequest(req, res, next) {
      res.send(`Admin request processed ${req.url}`);
    },

    requestProcessor(req, res, next) {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

      if (req.url.startsWith(adminPath)) {
        requestHelper.processAdminRequest(req, res);
        return;
      }

      const forApi = req.method + ":" + req.url;
      let target = requestHelper.findMatching(req);

      if (target.length > 0 && res.header["backsim-proxify"] !== "true") {
        if (requestHelper.processFoundRequest(req, res, next, target)) {
          return;
        }
      }
      if (args.p) {
        // in Proxy mode
        requestHelper.processProxyRequest(req, res, next);
        return;
      }
      res.send(`Hello, I have not been able to find the right matching handler for request ${forApi}`);
    }

  }
;

module.exports = requestHelper;
