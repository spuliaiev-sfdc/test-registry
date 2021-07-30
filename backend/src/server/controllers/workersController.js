let
  restResponse = require('./restResponse'),
  restRequest = require('./restRequest'),
  path = require('path');

const controller = {
  mappingUrl: '',
  database: null,
  workersManager: null,

  setupForServer(server, expressApp, parentUrl) {
    this.workersManager = server.workersManager;
  },

  async getListOfWorkers(req, res) {
    if (arguments.length === 0) return "/api/workers";
    let result = restResponse.oklist(this.workersManager.cleanupFromInternalInfo(await this.workersManager.listWorkers()));
    res.send(result);
  },

  async getPageListOfWorkers(req, res) {
    if (arguments.length === 0) return "/workers";
    return res.render("workers", {
      title: "Workers",
      workers: this.workersManager.cleanupFromInternalInfo(await  this.workersManager.listWorkers())
    });
  },

  async getWorkerInfo(req, res) {
    if (arguments.length === 0) return "/api/workers/*";
    let workerId = req.query.id;
    res.send(restResponse.ok(this.workersManager.cleanupFromInternalInfo(await this.workersManager.getWorkerById(workerId))));
  },

  async getPageWorkerInfo(req, res) {
    if (arguments.length === 0) return "/workers/*";
    let workerId = req.query.id;
    return res.render("workers", {
      title: "Workers",
      worker: this.workersManager.cleanupFromInternalInfo(this.workersManager.getWorkerById(workerId))
    });
  },


}

module.exports = controller;
