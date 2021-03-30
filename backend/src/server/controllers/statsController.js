let
  repositoryTests = require('../../storage/data/testRecord'),
  repositoryFTestInv = require('../../storage/data/fTestInventoryRecord'),
  repositoryTeams = require('../../storage/data/teamsRecord'),
  restResponse = require('./restResponse'),
  restRequest = require('./restRequest'),
  chartsUtils = require('../utils/chartsUtils'),
  path = require('path');

const controller = {
  mappingUrl: '/api/stats',
  database: null,

  setupForServer(server, expressApp, parentUrl) {
  },

  async getTestsDistribution(req, res) {
    if (arguments.length === 0) return "testDistribution";
    let testsByKind = await repositoryTests.getTestsDistributionByKind(this.database);
    let chartData = chartsUtils.convertToPieChart(testsByKind);
    let response = restResponse.ok(chartData);
    res.send(response);
  },

  async getTestsDistributionByLibs(req, res) {
    if (arguments.length === 0) return "testDistributionByLibs";
    let testsByKind = await repositoryTests.getTestsDistributionByArea(this.database);
    let chartData = chartsUtils.convertToPieChart(testsByKind);
    let response = restResponse.ok(chartData);
    res.send(response);
  },

  async getCounts(req, res) {
    if (arguments.length === 0) return "counts";
    let testsCount = await repositoryTests.getTestsCount(this.database);
    let fTestInvCount = await repositoryFTestInv.getFTestInventorySize(this.database);
    let teamsNamesFromFTestInv = await repositoryFTestInv.getUniqueTeamNames(this.database);
    let teamsNamesFromTests = await repositoryTests.getUniqueTeamNames(this.database);
    let completeTeamsSet = new Set([...teamsNamesFromFTestInv, ...teamsNamesFromTests]);

    let response = restResponse.ok({
      testsCount: testsCount,
      fTestInvCount: fTestInvCount,
      teamsCount: completeTeamsSet.size
    });
    res.send(response);
  },

}

module.exports = controller;
