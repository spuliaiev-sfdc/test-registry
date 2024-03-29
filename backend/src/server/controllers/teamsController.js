let
  repositoryTests = require('../../storage/data/testRecord'),
  repositoryFTestInv = require('../../storage/data/fTestInventoryRecord'),
  repositoryTeams = require('../../storage/data/teamsRecord'),
  restResponse = require('./restResponse'),
  restRequest = require('./restRequest'),
  teamDataSnapshot = require('../../utils/teamDataSnapshot'),
  corUtil = require("../../corUtils"),
  path = require('path');

const controller = {
  mappingUrl: '/api/teams',
  database: null,

  setupForServer(server, expressApp, parentUrl) {
  },

  async getUniqueTeamNameList(req, res) {
    if (arguments.length === 0) return "list";
    try {
      let teamsNamesFromFTestInv = await repositoryFTestInv.getUniqueTeamNames(this.database);
      let teamsNamesFromTests = await repositoryTests.getUniqueTeamNames(this.database);
      let completeTeamsSet = new Set([...teamsNamesFromFTestInv, ...teamsNamesFromTests]);

      let response = restResponse.ok(Array.from(completeTeamsSet));
      res.send(response);
    } catch (e) {
      corUtil.error(`Controller method error`, e);
    }
  },

  async getTeamInformation(req, res) {
    if (arguments.length === 0) return "info";
    try {
      let team = req.query.team;
      let info = teamDataSnapshot.getTeamInfo(team);

      let response = restResponse.ok(info);
      res.send(response);
    } catch (e) {
      corUtil.error(`Controller method error`, e);
    }

  }


}

module.exports = controller;
