var
  assert = require('assert'),
  utils = require('../src/corUtils.js')
    // This is just to set logging to warnings level
    .warningsOnly(),
  teamDataSnapshot = require('../src/utils/teamDataSnapshot');

// Async Testing utilities
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const { expect } = chai;
chai.use(chaiAsPromised);

describe('teamDataSnapshot', function() {
  describe('#loadTeamNamesFile()', function () {
    it('Verify loading of the TeamNames XML', function () {
      let rootFolder = '/Users/spuliaiev/blt/app/main/core';
      let runInfo = { rootFolder: rootFolder }; // do not write reports

      return expect(
        teamDataSnapshot.loadTeamNamesFile(runInfo)
      ).to.eventually.be.fulfilled
        .then((result) => {
          assert.equal(teamDataSnapshot.loadedXml, true);
          assert.equal(teamDataSnapshot.filePathContents.startsWith("<?xml"), true);
        });
    });
  });
});
