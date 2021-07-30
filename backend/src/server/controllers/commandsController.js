let
  restResponse = require('./restResponse'),
  reindexAllWorker = require('../../workers/reindexAllWorker'),
  ownershipReportWorker = require('../../workers/ownershipReportWorker');

const controller = {
  mappingUrl: '',
  database: null,
  workersManager: null,

  setupForServer(server, expressApp, parentUrl) {
    this.workersManager = server.workersManager;
    this.server = server;
  },

  async getReindexAll(req, res) {
    if (arguments.length === 0) return "/api/commands/reindexAll";
    let workerInfo = await this.workersManager.initWorker("ReindexAllWorker", reindexAllWorker, this.server);
    res.send(restResponse.ok({
      status: workerInfo.status,
      workerId: workerInfo.id,
      workerName: workerInfo.name
    }));
  },

  async getOwnershipReport(req, res) {
    if (arguments.length === 0) return "/api/commands/ownershipReport";
    let workerInfo = await this.workersManager.initWorker("OwnershipReportWorker", ownershipReportWorker, this.server);
    res.send(restResponse.ok({
      status: "enqueued",
      workerId: workerInfo.id,
      workerName: workerInfo.name
    }));
  },

  async getPageOwnershipReport(req, res) {
    if (arguments.length === 0) return "/ownershipReport";
    return res.render("ownershipReportRequest", {
      title: "Workers",
      worker: this.workersManager.getWorkerById(workerId)
    });

  },

}

module.exports = controller;
