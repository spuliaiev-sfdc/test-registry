let
  repositoryTests = require('../../storage/data/testRecord'),
  repositoryFTestInv = require('../../storage/data/fTestInventoryRecord'),
  repositoryTeams = require('../../storage/data/teamsRecord'),
  restResponse = require('./restResponse'),
  restRequest = require('./restRequest'),
  fileStorage = require('../../storage/filesStorage'),
  path = require('path');

const controller = {
  mappingUrl: '/api/files',
  database: null,

  setupForServer(server, expressApp, parentUrl) {
  },

  async getFileContent(req, res) {
    if (arguments.length === 0) return "content";
    let filePath = req.query.filePath;
    let fileInfo = await fileStorage.getFile(filePath);

    if(fileInfo.success && fileInfo.found) {
      res.send(restResponse.ok(fileInfo));
    } else {
      res.send(restResponse.failed(400, fileInfo));
    }
  },

  async getViewFile(req, res) {
    if (arguments.length === 0) return "viewFile";
    let filePath = req.query.filePath;
    let fileInfo = await fileStorage.getFile(filePath);

    res.render("viewFile", { title: "View File "+filePath, fileInfo });
  },

}

module.exports = controller;
