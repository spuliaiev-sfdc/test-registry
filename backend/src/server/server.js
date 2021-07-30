const
  express = require('express'),
  path = require('path'),
  fs = require('fs'),
  utils = require('../corUtils.js'),
  morgan = require('morgan'), // HTTP logging
  teamDataSnapshot = require('../utils/teamDataSnapshot'),
  bodyParser = require('body-parser');

/**
 * https://auth0.com/blog/create-a-simple-and-stylish-node-express-app/
 */
const server = {
  coreFolder: null,
  outputFolder: null,
  logsFolder: null,

  async setupLibraries(app) {
    let staticPrefix = __dirname+"/../..";
    app.use('/jquery', express.static(staticPrefix + '/node_modules/jquery/dist/'));
    app.use('/bootstrap', express.static(staticPrefix + '/node_modules/bootstrap/dist/'));
    app.use('/bootstrap-material-design', express.static(staticPrefix + '/node_modules/bootstrap-material-design/dist/'));
    app.use('/datatables', express.static(staticPrefix + '/node_modules/datatables.net/'));
    app.use('/datatables-bs4', express.static(staticPrefix + '/node_modules/datatables.net-bs4/'));
    app.use('/popper', express.static(staticPrefix + '/node_modules/@popperjs/core/dist/'));
    app.use('/charts', express.static(staticPrefix + '/node_modules/chart.js/dist/'));
    app.use('/bootstrap-icons', express.static(staticPrefix + '/node_modules/bootstrap-icons/'));
    app.use('/bootstrap-4-autocomplete', express.static(staticPrefix + '/node_modules/bootstrap-4-autocomplete/dist/'));
    app.use('/prismjs', express.static(staticPrefix + '/node_modules/prismjs/'));
  },

  async startServer(options) {
    const app = express();
    // copy all the options
    Object.assign(this, options);

    app.set("views", path.resolve("server/views"));
    app.use(express.static(path.resolve("server/public")));

    app.use(bodyParser.json({limit: '50mb', extended: true}));
    app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
    app.set("view engine", "pug");
    app.set('json spaces', 2);
    await this.setupLibraries(app);

    // adding morgan to log HTTP requests
    if (this.logsFolder) {
      // create a write stream (in append mode)
      let accessLogStream = fs.createWriteStream(path.join(this.logsFolder, 'access.log'), { flags: 'a' })
      app.use(morgan('combined', { stream: accessLogStream }))
    } else {
      app.use(morgan('combined'));
    }

    utils.log("Fetching teams information...");
    try {
      await teamDataSnapshot.loadTeamNamesFile({ rootFolder: this.coreFolder });
      utils.log(" done...");
    } catch (e) {
      utils.log(" failed...", e);
    }

    await this.setupRoutes(app);

    let http = require('http');
    let https = require('https');
    let privateKey  = fs.readFileSync('server/sslcert/localhost+2-key.pem', 'utf8');
    let certificate = fs.readFileSync('server/sslcert/localhost+2.pem', 'utf8');

    let credentials = {key: privateKey, cert: certificate};

    let httpServer = http.createServer(app);
    let httpsServer = https.createServer(credentials, app);

    httpServer.listen(this.port, () => console.log(`Example app listening at http://localhost:${this.port}`));
    httpsServer.listen(this.portSSL, () => console.log(`Example app listening at https://localhost:${this.portSSL}`));
  },

  async setupRoutes(app) {
    utils.impt(`HTTP Server registration start`);

    // Loading and binding all the controllers
    let entries = fs.readdirSync("src/server/controllers");
    for(let i=0; i<entries.length; i++) {
      if (entries[i].endsWith("Controller.js")) {
        utils.log(`detected controller:${entries[i]}`)
        await this.setupController(require("./controllers/" + entries[i]), app);
      }
    }

    // Old style binding for pages
    app.get("/", (req, res) => {
      res.render("index", { title: "Home" });
    });
    app.get("/testsByTeam", (req, res) => {
      res.render("testsByTeam", { title: "Tests By Team" });
    });
    app.get("/teams", (req, res) => {
      res.render("teams", { title: "Teams reference" });
    });
    utils.impt(`HTTP Server registration done`);
  },

  async setupController(controller, expressApp) {
    controller.database = this.database;
    let parentUrl = controller.mappingUrl;
    utils.impt(`  Controller registration ${controller.constructor.name} ${parentUrl}`);
    if (controller.setupForServer) {
      controller.setupForServer(this, expressApp, "");
    }

    for(let elementName in controller) {
      if (controller.hasOwnProperty(elementName)) {
        if (typeof controller[elementName] === 'function'){
          if ( elementName.startsWith("get")) {
            let urlMapping = path.join(parentUrl, await controller[elementName]());
            if (typeof urlMapping == "string") {
              utils.impt(`    method GET   ${urlMapping} for ${elementName}`);
              expressApp.get(urlMapping, async (req, res) => {
                return await controller[elementName](req, res);
              });
            }
          }
          if (elementName.startsWith("put")) {
            let urlMapping = path.join(parentUrl, await controller[elementName]());
            if (typeof urlMapping == "string") {
              utils.impt(`    method PUT   ${urlMapping} for ${elementName}`);
              expressApp.put(urlMapping, async (req, res) => {
                return await controller[elementName](req, res);
              });
            }
          }
          if (elementName.startsWith("post")) {
            let urlMapping = path.join(parentUrl, await controller[elementName]());
            if (typeof urlMapping == "string") {
              utils.impt(`    method POST   ${urlMapping} for ${elementName}`);
              expressApp.post(urlMapping, async (req, res) => {
                return await controller[elementName](req, res);
              });
            }
          }
          if (elementName.startsWith("patch")) {
            let urlMapping = path.join(parentUrl, await controller[elementName]());
            if (typeof urlMapping == "string") {
              utils.impt(`    method PATCH  ${urlMapping} for ${elementName}`);
              expressApp.patch(urlMapping, async (req, res) => {
                return await controller[elementName](req, res);
              });
            }
          }
          if (elementName.startsWith("delete")) {
            let urlMapping = path.join(parentUrl, await controller[elementName]());
            if (typeof urlMapping == "string") {
              utils.impt(`    method DELETE ${urlMapping} for ${elementName}`);
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
