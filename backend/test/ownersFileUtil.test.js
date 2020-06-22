var
  assert = require('assert'),
  utils = require('../src/corUtils.js')
    // This is just to set logging to warnings level
    .warningsOnly(),
  resolve = require('path').resolve,
  ownersFileUtil = require('../src/utils/ownersFileUtil');

let rootFolder = './test-projects/ownershipFileSamples';

// Test Suites
describe('ownersFileUtil', function() {
  describe('#getFileOwningTeam()', function() {
    it('Default team ownership file', function () {
      let realFileInfo = utils.analyseFileLocation('./test-projects/small', 'folder_02/java/src/package_02_01/file_02_01-02.java');
      // change the ownership file info to the testing one
      realFileInfo.ownershipFilePath = '../ownershipFileSamples/defaultTeam.yaml';
      let result = ownersFileUtil.getFileOwningTeam(realFileInfo);
      assert.deepEqual(result, {
        errors: [],
        owningTeam: 'Team 01 Name',
        success: true
      });
    });
    it('One team ownership file - completePathMatch', function () {
      let realFileInfo = utils.analyseFileLocation('./test-projects/small', 'folder_02/java/src/package_02_01/file_02_01-02.java');
      // change the ownership file info to the testing one
      realFileInfo.ownershipFilePath = '../ownershipFileSamples/oneTeam.yaml';
      let result = ownersFileUtil.getFileOwningTeam(realFileInfo);
      assert.deepEqual(result, {
        errors: [],
        owningTeam: 'Other Team 02 Name',
        success: true
      });
    });
    it('One team ownership file - otherFile', function () {
      let fileName = 'folder_02/java/src/package_02_01/file_02_01-01.java';
      let realFileInfo = utils.analyseFileLocation('./test-projects/small', fileName);
      // change the ownership file info to the testing one
      realFileInfo.ownershipFilePath = '../ownershipFileSamples/oneTeam.yaml';
      let result = ownersFileUtil.getFileOwningTeam(realFileInfo);
      assert.deepEqual(result, {
        errors: [],
        owningTeam: 'Main Team 01 Name',
        success: true
      });
    });
    it('Two teams ownership file - Wild - Team 02', function () {
      let fileName = 'folder_02/java/src/file_02-01.java';
      let realFileInfo = utils.analyseFileLocation('./test-projects/small', fileName);
      // change the ownership file info to the testing one
      realFileInfo.ownershipFilePath = '../ownershipFileSamples/twoTeams.yaml';
      let result = ownersFileUtil.getFileOwningTeam(realFileInfo);
      assert.deepEqual(result, {
        errors: [],
        owningTeam: 'Another Team 02 Name',
        success: true
      }, "Should be Team 02 as it has more precise path");
    });
    it('Two teams ownership file - Wild - Team 03', function () {
      let fileName = 'folder_02/java/src/package_02_01/file_02_01-02.java';
      let realFileInfo = utils.analyseFileLocation('./test-projects/small', fileName);
      // change the ownership file info to the testing one
      realFileInfo.ownershipFilePath = '../ownershipFileSamples/twoTeams.yaml';
      let result = ownersFileUtil.getFileOwningTeam(realFileInfo);
      assert.deepEqual(result, {
        errors: [],
        owningTeam: 'The Other Team 03 Name',
        success: true
      }, "Should be Team 03 as it has more precise path");
    });
  });
  describe('#readAndVerifyOwnershipFile()', function() {
    it('absent ownership file', function () {
      let fileName = 'absent.yaml';
      let result = ownersFileUtil.readAndVerifyOwnershipFile(rootFolder, fileName);
      assert.deepEqual(result, {
        content: null,
        errors: [
          'Ownership file not exists: absent.yaml'
        ],
        success: false
      });
    });
    it('empty ownership file', function () {
      let fileName = 'empty.yaml';
      let result = ownersFileUtil.readAndVerifyOwnershipFile(rootFolder, fileName);
      assert.deepEqual(result, {
        content: null,
        errors: [
          'Ownership file is empty: empty.yaml'
        ],
        success: false
      });
    });
    it('Default team ownership file', function () {
      let fileName = 'defaultTeam.yaml';
      let result = ownersFileUtil.readAndVerifyOwnershipFile(rootFolder, fileName);
      assert.deepEqual(result, {
        content: {
          module: {
            groupId: 'my.projects',
            artifactId: 'folder_02',
            isTest: false
          },
          ownership: [
            {
              team: 'Team 01 Name'
            }
          ]
        },
        errors: [],
        success: true,
        defaultOwningTeam: 'Team 01 Name'
      });
    });
    it('One team ownership file - fullPath', function () {
      let fileName = 'oneTeam.yaml';
      let result = ownersFileUtil.readAndVerifyOwnershipFile(rootFolder, fileName);
      assert.deepEqual(result,{
        content: {
          module: {
            groupId: 'my.projects',
            artifactId: 'folder_02',
            isTest: false
          },
          ownership: [
            {
              team: 'Main Team 01 Name'
            },
            {
              team: 'Other Team 02 Name',
              paths: [
                'java/src/package_02_01/file_02_01-02.java'
              ]
            }
          ]
        },
        errors: [],
        success: true,
        defaultOwningTeam: 'Main Team 01 Name'
      });
    });
  });
});
