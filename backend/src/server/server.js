const
  express = require('express'),
  path = require('path'),
  morgan = require('morgan'), // HTTP logging
  bodyParser = require('body-parser');

/**
 * https://auth0.com/blog/create-a-simple-and-stylish-node-express-app/
 */
const server = {
  coreFolder: null,
  outputFolder: null,

  startServer(options) {
    const app = express();
    this.coreFolder = options.coreFolder;
    this.outputFolder = options.outputFolder;
    this.port = options.port;

    app.set("views", path.resolve("server/views"));
    app.use(express.static(path.resolve("server/public")));


    app.use(bodyParser.json({limit: '50mb', extended: true}));
    app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
    app.set("view engine", "pug");
    // adding morgan to log HTTP requests
    app.use(morgan('combined'));

    this.setupRoutes(app);
    app.listen(this.port, () => console.log(`Example app listening at http://localhost:${this.port}`))

  },

  setupRoutes(app) {
    app.get("/", (req, res) => {
      res.render("index", { title: "Home" });
    });
  }
}

module.exports = server;
