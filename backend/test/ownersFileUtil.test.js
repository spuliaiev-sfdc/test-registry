var
  assert = require('assert'),
  utils = require('../src/corUtils.js')
    // This is just to set logging to warnings level
    .warningsOnly(),
  resolve = require('path').resolve,
  ownersFileUtil = require('../src/utils/ownersFileUtil');

let rootFolder = "./test-projects/ownershipFileSamples";

// Test Suites
describe('ownersFileUtil', function() {
  describe('#readAndVerifyOwnershipFile()', function() {
    it('absent ownership file', function () {
      let fileName = "absent.yaml";
      let result = ownersFileUtil.readAndVerifyOwnershipFile(rootFolder, fileName);
      assert.deepEqual(result, {
        "content": null,
        "errors": [
          "Ownership file not exists: absent.yaml"
        ],
        "success": false
      });
    });
    it('empty ownership file', function () {
      let fileName = "empty.yaml";
      let result = ownersFileUtil.readAndVerifyOwnershipFile(rootFolder, fileName);
      assert.deepEqual(result, {
        "content": null,
        "errors": [
          "Ownership file is empty: empty.yaml"
        ],
        "success": false
      });
    });
    it('Default team ownership file', function () {
      let fileName = "defaultTeam.yaml";
      let result = ownersFileUtil.readAndVerifyOwnershipFile(rootFolder, fileName);
      assert.deepEqual(result, {
        "content": {
          "module": {
            "groupId": "my.projects",
            "artifactId": "module_01",
            "isTest": false
          },
          "ownership": [
            {
              "team": "Team 01 Name"
            }
          ]
        },
        "errors": [],
        "success": true,
        "owningTeam": "Team 01 Name"
      });
    });
  });
  it('One team ownership file - fullPath', function () {
    let fileName = "oneTeam.yaml";
    let result = ownersFileUtil.readAndVerifyOwnershipFile(rootFolder, fileName);
    assert.deepEqual(result,{
      "content": {
        "module": {
          "groupId": "my.projects",
          "artifactId": "module_01",
          "isTest": false
        },
        "ownership": [
          {
            "team": "Main Team 01 Name"
          },
          {
            "team": "Other Team 02 Name",
            "paths": [
              "java/src/pack1/subpack1/File01.java"
            ]
          }
        ]
      },
      "errors": [],
      "success": true,
      "owningTeam": "Main Team 01 Name"
    });
  });
});
