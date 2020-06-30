const
  express = require('express'),
  path = require('path'),
  corUtils = require('../corUtils.js'),
  morgan = require('morgan'), // HTTP logging
  testController = require('./controllers/testsController'),
  bodyParser = require('body-parser');

/**
 * https://auth0.com/blog/create-a-simple-and-stylish-node-express-app/
 */
const server = {
  coreFolder: null,
  outputFolder: null,
  logsFolder: null,

  async startServer(options) {
    const app = express();
    this.coreFolder = options.coreFolder;
    this.outputFolder = options.outputFolder;
    this.logsFolder = options.logsFolder;
    this.port = options.port;
    this.database = options.database;

    app.set("views", path.resolve("server/views"));
    app.use(express.static(path.resolve("server/public")));

    app.use(bodyParser.json({limit: '50mb', extended: true}));
    app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
    app.set("view engine", "pug");
    // adding morgan to log HTTP requests
    if (this.logsFolder) {
      // create a write stream (in append mode)
      let accessLogStream = fs.createWriteStream(path.join(this.logsFolder, 'access.log'), { flags: 'a' })
      app.use(morgan('combined', { stream: accessLogStream }))
    } else {
      app.use(morgan('combined'));
    }

    this.setupRoutes(app);
    app.listen(this.port, () => console.log(`Example app listening at http://localhost:${this.port}`))

  },

  setupRoutes(app) {
    corUtils.impt(`HTTP Server registration start`);
    this.setupController(testController, app);

    app.get("/", (req, res) => {
      res.render("index", { title: "Home" });
    });
      // res.render("unknownMethod", {
      //   controller: "TestsController",
      //   url: "unknown",
      //   method:""
      // });
    corUtils.impt(`HTTP Server registration done`);
  },

  async setupController(controller, expressApp) {
    controller.database = this.database;
    let parentUrl = controller.mappingUrl;
    corUtils.impt(`  Controller registration ${controller.constructor.name} ${parentUrl}`);

    for(let elementName in controller) {
      if (controller.hasOwnProperty(elementName)) {
        if (typeof controller[elementName] === 'function'){
          if ( elementName.startsWith("get")) {
            let urlMapping = path.join(parentUrl, await controller[elementName]());
            if (typeof urlMapping == "string") {
              corUtils.impt(`    method ${urlMapping} for ${elementName}`);
              expressApp.get(urlMapping, async (req, res) => {
                return await controller[elementName](req, res);
              });
            }
          }
          if (elementName.startsWith("put")) {
            let urlMapping = path.join(parentUrl, await controller[elementName]());
            if (typeof urlMapping == "string") {
              corUtils.impt(`    method ${urlMapping} for ${elementName}`);
              expressApp.put(urlMapping, async (req, res) => {
                return await controller[elementName](req, res);
              });
            }
          }
          if (elementName.startsWith("post")) {
            let urlMapping = path.join(parentUrl, await controller[elementName]());
            if (typeof urlMapping == "string") {
              corUtils.impt(`    method ${urlMapping} for ${elementName}`);
              expressApp.post(urlMapping, async (req, res) => {
                return await controller[elementName](req, res);
              });
            }
          }
          if (elementName.startsWith("delete")) {
            let urlMapping = path.join(parentUrl, await controller[elementName]());
            if (typeof urlMapping == "string") {
              corUtils.impt(`    method ${urlMapping} for ${elementName}`);
              expressApp.delete(urlMapping, async (req, res) => {
                return await controller[elementName](req, res);
              });
            }
          }
        }
      }
    }
  },
}

module.exports = server;
