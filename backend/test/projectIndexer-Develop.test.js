var
  assert = require('assert'),
  utils = require('../src/corUtils.js')
    // This is just to set logging to warnings level
    // .warningsOnly()
  ,
  testAnalyser = require('../src/parsers/testAnalyser'),
  projectIndexer = require('../src/projectIndexer');

// Async Testing utilities
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const { expect } = chai;
chai.use(chaiAsPromised);

// Override the ScanFile updates to save into array to do not break the testing folder structure and content
let addedFoldersIntoScanFile = [];
projectIndexer.addProcessedFolderToScanFile = (runInfo, processedFolderName) => {
  addedFoldersIntoScanFile.push(processedFolderName);
}

// Test Suites
describe('projectIndexer', function() {
  describe('#runFileAnalysis()', function() {
    it('Test Java file', function () {
      let rootFolder = '/Users/spuliaiev/blt/app/main/core';
      let fileName = 'tableau-dataservice/test/unit/java/strictunit/analytics/dataservice/test/unit/DataServiceBasicTest.java';
      let fileInfo = testAnalyser.verifyFileIsTest(rootFolder, fileName);
      let runInfo = { reportFolder: null }; // do not write reports
      let status = {};

      return expect(
        projectIndexer.runFileAnalysis(runInfo, status, fileInfo)
      ).to.eventually.be.fulfilled
        .then((result) => {
          assert.equal(fileInfo.hasOwnProperty("javaInfo"), true);

          assert.equal(fileInfo.javaInfo.success, true);
        });
    });
  });
});
