const
  express = require('express'),
  path = require('path'),
  bodyParser = require('body-parser');

const server = {
  coreFolder: null,
  outputFolder: null,

  startServer(options) {
    const app = express();
    app.get("/", (req, res) => {
      res.render("index", { title: "Home" });
    });
    app.use(bodyParser.json({limit: '50mb', extended: true}));
    app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
    app.set("views", path.resolve("views"));
    app.set("view engine", "pug");
    this.coreFolder = options.coreFolder;
    this.outputFolder = options.outputFolder;
    this.port = options.port;
    app.listen(this.port, () => console.log(`Example app listening at http://localhost:${this.port}`))

  }
}

module.exports = server;
