var
  assert = require('assert'),
  projectIndexer = require('../src/projectIndexer');


describe('projectIndexer', function() {
  describe('#iterateProject()', function() {
    it('empty project folder', function () {
      let rootFolder = "./test-projects/empty";
      let result = projectIndexer.iterateProject(rootFolder);
      assert.deepEqual(result, {
        "rootFolder": "./test-projects/empty",
        "rootFoldersDetected": 0,
        "rootFilesDetected": 0
      });
    });
    it('small project folder', function () {
      let rootFolder = "./test-projects/small";
      let result = projectIndexer.iterateProject(rootFolder);
      assert.deepEqual(result, {
        "rootFolder": "./test-projects/small",
        "rootFoldersDetected": 2,
        "rootFilesDetected": 0
      });
    });
    it('big project folder', function () {
      let rootFolder = "./test-projects/big";
      let result = projectIndexer.iterateProject(rootFolder);
      assert.deepEqual(result, {
        "rootFolder": "./test-projects/big",
        "rootFoldersDetected": 0,
        "rootFilesDetected": 0
      });
    });
  });
});
