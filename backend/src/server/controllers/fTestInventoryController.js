let
  repository = require('../../storage/data/fTestInventoryRecord'),
  restResponse = require('./restResponse'),
  restRequest = require('./restRequest'),
  path = require('path');

const controller = {
  mappingUrl: '/api/fTestInv',
  database: null,

  setupForServer(server, expressApp, parentUrl) {
  },

  async getAllTests(req, res) {
    if (arguments.length === 0) return "all";
    res.send(`hello world from TestsController.getAllTests\n` +
            await  repository.getRecords(this.database));
  },

  async getAllTestsCount(req, res) {
    if (arguments.length === 0) return "count";
    res.send(`hello world from TestsController.getAllTests\n` +
            await repository.getRecords(this.database));
  },

  async getByTeamName(req, res) {
    if (arguments.length === 0) return "find";
    let requestContent = restRequest.analyse(req);
    let team = req.query.team;
    if (team) {
      res.send(restResponse.oklist(await  repository.getRecordsByTeam(this.database, requestContent, team)));
    } else {
      res.send(restResponse.failed(restResponse.INVALID_PARAMETER('team')));
    }
  },

  async putTest(req, res) {
    if (arguments.length === 0) return "put";
    let id = await repository.insertRecord(this.database, req.body);
    res.send( 'hello world from TestsController.getAllTests' +
              ` RecordId = ${id}`);
  },

}

module.exports = controller;
