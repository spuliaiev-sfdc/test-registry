let
  testRecord = require('../../storage/data/testRecord'),
  fTestInv = require('../../storage/data/fTestInventoryRecord'),
  path = require('path');

const testsController = {
  mappingUrl: '/api/tests',
  database: null,

  setupForServer(server, expressApp, parentUrl) {
  },

  async getAllTests(req, res) {
    if (arguments.length === 0) return "all";
    res.send(`hello world from TestsController.getAllTests\n` +
            JSON.stringify(await  testRecord.getRecords(this.database), null, 2));
  },

  async getAllInvs(req, res) {
    if (arguments.length === 0) return "allInvs";
    res.send(`hello world from TestsController.getAllInvs\n` +
            JSON.stringify(await  fTestInv.getRecords(this.database), null, 2));
  },

  async putTest(req, res) {
    if (arguments.length === 0) return "put";
    let id = await testRecord.insertRecord(this.database, req.body);
    res.send( 'hello world from TestsController.getAllTests' +
              ` RecordId = ${id}`);
  },

  async putInv(req, res) {
    if (arguments.length === 0) return "putInventory";
    let id = await fTestInv.insertRecord(this.database, req.body);
    res.send( 'hello world from TestsController.getAllTests' +
              ` RecordId = ${id}`);
  }
}

module.exports = testsController;
