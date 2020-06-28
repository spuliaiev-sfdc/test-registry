var
  assert = require('assert'),
  utils = require('../src/corUtils.js')
    // This is just to set logging to warnings level
    .warningsOnly(),
  testAnalyser = require('../src/parsers/testAnalyser'),
  projectIndexer = require('../src/projectIndexer');

// Override the ScanFile updates to save into array to do not break the testing folder structure and content
let addedFoldersIntoScanFile = [];
projectIndexer.addProcessedFolderToScanFile = (runInfo, processedFolderName) => {
  addedFoldersIntoScanFile.push(processedFolderName);
}

// Test Suites
describe('projectIndexer', function() {
  describe('#runFileAnalysis()', function() {
    it('Simple Java Prod file', function () {
      let rootFolder = './test-projects/javaProject/';
      let fileName = 'module01/test/func/java/src/some/production/folder/SimpleJavaTest.java';
      let fileInfo = testAnalyser.verifyFileIsTest(rootFolder, fileName);
      let runInfo = { reportFolder: null }; // do not write reports
      let status = {};
      projectIndexer.runFileAnalysis(runInfo, status, fileInfo);
      assert.equal(fileInfo.hasOwnProperty("javaInfo"), true);

      assert.equal(fileInfo.javaInfo.success, true);
      assert.equal(fileInfo.javaInfo.info.classes[0].className, "SimpleJavaTest");
      assert.deepEqual(fileInfo.javaInfo.javaOwnershipInfo, {
        classInfo: {
          labels: {
            'SomeLabel.ClassLabel01': ['TestLabel class annotation']
          },
          owners: {
            'FTEnvTeam_Main': ['FTestInventory category scrumteam'],
            'Team_01'     : ['ScrumTeam class annotation'],
            'Team_01_Sub' : ['ScrumTeam javadoc'],
            "The Other Team 03 Name": ['Ownership.yaml']
          },
          ownersPartial: {
            'Team_02': ['ScrumTeam method annotation']
          },
          partialIN_DEV: [
            'testFirstMethod_01'
          ]
        },
        methodsInfo: {
          'testFirstMethod_01': {
            IN_DEV: true,
            labels: {
              'IgnoreFailureReason.IN_DEV': ['TestLabel method annotation']
            },
            name: 'testFirstMethod_01',
            owners: {}
          },
          'testSecondMethod_02': {
            labels: {
              'IgnoreFailureReason.Label1': ['TestLabel method annotation'],
              'IgnoreFailureReason.Label2': ['TestLabel method annotation']
            },
            name: 'testSecondMethod_02',
            owners: {
              'Team_02': ['ScrumTeam method annotation']
            }
          }
        }
      });

      assert.equal(fileInfo.hasOwnProperty("ownershipFile"), true);
      assert.equal(fileInfo.ownershipFile.success, true);
      assert.equal(fileInfo.ownershipFile.owningTeam, 'The Other Team 03 Name');

      // Verify Report
      assert.deepEqual(fileInfo.report, {
        class: 'some.production.folder.SimpleJavaTest',
        module: 'module01/test/func',
        relative: 'module01/test/func/java/src/some/production/folder/SimpleJavaTest.java',
        testKind: 'func',
        classInfo: {
          labels: {
            'SomeLabel.ClassLabel01': ['TestLabel class annotation']
          },
          owners: {
            'FTEnvTeam_Main': ['FTestInventory category scrumteam'],
            'Team_01': ['ScrumTeam class annotation'],
            'Team_01_Sub': ['ScrumTeam javadoc'],
            'The Other Team 03 Name': ['Ownership.yaml']
          },
          ownersPartial: {
            'Team_02': ['ScrumTeam method annotation']
          },
          partialIN_DEV: [
            "testFirstMethod_01"
          ]
        },
        methodsInfo: {
          'testFirstMethod_01': {
            IN_DEV: true,
            labels: {
              'IgnoreFailureReason.IN_DEV': ['TestLabel method annotation']
            },
            name: 'testFirstMethod_01',
            owners: {}
          },
          'testSecondMethod_02': {
            labels: {
              'IgnoreFailureReason.Label1': ['TestLabel method annotation'],
              'IgnoreFailureReason.Label2': ['TestLabel method annotation']
            },
            name: 'testSecondMethod_02',
            owners: {
              'Team_02': ['ScrumTeam method annotation']
            }
          }
        }
      });
    });
  });
  describe('#iterateProject()', function() {
    it('empty project folder', function () {
      let rootFolder = './test-projects/empty';
      addedFoldersIntoScanFile = [];
      let result = projectIndexer.iterateProject(rootFolder);
      assert.deepEqual(result, {
        foldersProcessedAlready: new Set([]),
        foldersProcessed: 0,
        rootFolder: './test-projects/empty',
        rootFoldersDetected: 0,
        rootFilesDetected: 0,
        lastScanFile: 'lastScan.log',
        reportFolder: undefined,
        rescan: undefined,
        onReportGenerated: undefined,
        errors: [],
      });
      assert.deepEqual(addedFoldersIntoScanFile, []);
    });
    it('small project folder', function () {
      let rootFolder = './test-projects/small';
      addedFoldersIntoScanFile = [];
      let result = projectIndexer.iterateProject(rootFolder);
      assert.deepEqual(result, {
        foldersProcessedAlready: new Set([]),
        foldersProcessed: 7,
        rootFolder: './test-projects/small',
        rootFoldersDetected: 2,
        rootFilesDetected: 0,
        lastScanFile: 'lastScan.log',
        reportFolder: undefined,
        rescan: undefined,
        onReportGenerated: undefined,
        errors: [],
      });
      assert.deepEqual(addedFoldersIntoScanFile, ['folder_02', 'folder_01']);
    });
    it('small project folder with Preprocessed folders', function () {
      let rootFolder = './test-projects/smallPartial';
      addedFoldersIntoScanFile = [];
      let result = projectIndexer.iterateProject(rootFolder);
      assert.deepEqual(result, {
        foldersProcessedAlready: new Set(['folder_01']),
        foldersProcessed: 4,
        lastScanFound: true,
        rootFolder: './test-projects/smallPartial',
        rootFoldersDetected: 2,
        rootFilesDetected: 1,
        lastScanFile: 'lastScan.log',
        reportFolder: undefined,
        rescan: undefined,
        onReportGenerated: undefined,
        errors: [],
      });
      assert.deepEqual(addedFoldersIntoScanFile, ['folder_02']);
    });
    it('big project folder', function () {
      let rootFolder = './test-projects/big';
      addedFoldersIntoScanFile = [];
      let result = projectIndexer.iterateProject(rootFolder);
      assert.deepEqual(result, {
        rootFolder: './test-projects/big',
        rootFoldersDetected: 0,
        rootFilesDetected: 0,
        foldersProcessedAlready: new Set([]),
        foldersProcessed: 0,
        lastScanFile: 'lastScan.log',
        reportFolder: undefined,
        rescan: undefined,
        onReportGenerated: undefined,
        errors: [],
      });
      assert.deepEqual(addedFoldersIntoScanFile, []);
    });
  });
});
