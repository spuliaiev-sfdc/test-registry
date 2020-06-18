var
  assert = require('assert'),
  utils = require('../src/corUtils.js')
    // This is just to set logging to warnings level
    .warningsOnly(),
  projectIndexer = require('../src/projectIndexer');


describe('projectIndexer', function() {
  describe('#iterateProject()', function() {
    it('empty project folder', function () {
      let rootFolder = "./test-projects/empty";
      let result = projectIndexer.iterateProject(rootFolder);
      assert.deepEqual(result, {
        "foldersProcessedAlready": new Set([]),
        "foldersProcessed": [],
        "rootFolder": "./test-projects/empty",
        "rootFoldersDetected": 0,
        "rootFilesDetected": 0
      });
    });
    it('small project folder', function () {
      let rootFolder = "./test-projects/small";
      let result = projectIndexer.iterateProject(rootFolder);
      assert.deepEqual(result, {
        "foldersProcessedAlready": new Set([]),
        "foldersProcessed": [
          "folder_02",
          "folder_02/folder_02_01",
          "folder_01"
        ],
        "rootFolder": "./test-projects/small",
        "rootFoldersDetected": 2,
        "rootFilesDetected": 0
      });
    });
    it('small project folder with Preprocessed folders', function () {
      let rootFolder = "./test-projects/smallPartial";
      let result = projectIndexer.iterateProject(rootFolder);
      assert.deepEqual(result, {
        "foldersProcessedAlready": new Set(["folder_01"]),
        "foldersProcessed": [
          "folder_02",
          "folder_02/folder_02_01"
        ],
        "lastScanFound": true,
        "rootFolder": "./test-projects/smallPartial",
        "rootFoldersDetected": 2,
        "rootFilesDetected": 1
      });
    });
    it('big project folder', function () {
      let rootFolder = "./test-projects/big";
      let result = projectIndexer.iterateProject(rootFolder);
      assert.deepEqual(result, {
        "rootFolder": "./test-projects/big",
        "rootFoldersDetected": 0,
        "rootFilesDetected": 0,
        "foldersProcessedAlready": new Set([]),
        "foldersProcessed": [],
      });
    });
  });
});
