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
    it('Simple Java Prod file', function () {
      let rootFolder = './test-projects/javaProject/';
      let fileName = 'module01/test/func/java/src/some/production/folder/SimpleJavaTest.java';
      let fileInfo = testAnalyser.verifyFileIsTest(rootFolder, fileName);
      let runInfo = { reportFolder: null }; // do not write reports
      let status = {};

      return expect(
        projectIndexer.runFileAnalysis(runInfo, status, fileInfo)
      ).to.eventually.be.fulfilled
        .then((result) => {
          assert.equal(fileInfo.hasOwnProperty("javaInfo"), true);

          assert.equal(fileInfo.javaInfo.success, true);
          assert.equal(fileInfo.javaInfo.info.classes[0].className, "SimpleJavaTest");
          assert.deepEqual(fileInfo.javaInfo.javaOwnershipInfo, {
            classInfo: {
              labels: [
                { name: 'SomeLabel.ClassLabel01', desc : ['TestLabel class annotation'] }
              ],
              owners: [
                { name: 'Team_01', desc: ['ScrumTeam class annotation']},
                { name: 'Team_01_Sub', desc: ['ScrumTeam javadoc']},
                { name: "The Other Team 03 Name", desc: ['Ownership.yaml']},
                { name: 'FTEnvTeam_Main', desc: ['FTestInventory category scrumteam']}
              ],
              ownersPartial: [
                { name: 'Team_02', desc: ['ScrumTeam method annotation']}
              ],
              partialIN_DEV: [
                'testFirstMethod_01'
              ]
            },
            methodsInfo: {
              'testFirstMethod_01': {
                IN_DEV: true,
                labels: [
                  { name: 'IgnoreFailureReason.IN_DEV', desc: ['TestLabel method annotation']}
                ],
                name: 'testFirstMethod_01',
                owners: []
              },
              'testSecondMethod_02': {
                labels: [
                  { name: 'IgnoreFailureReason.Label1', desc: ['TestLabel method annotation']},
                  { name: 'IgnoreFailureReason.Label2', desc: ['TestLabel method annotation']}
                ],
                name: 'testSecondMethod_02',
                owners: [
                  { name: 'Team_02', desc: ['ScrumTeam method annotation']}
                ]
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
              labels: [
                { name: 'SomeLabel.ClassLabel01', desc: ['TestLabel class annotation'] }
              ],
              owners: [
                { name: 'Team_01', desc: ['ScrumTeam class annotation']},
                { name: 'Team_01_Sub', desc: ['ScrumTeam javadoc']},
                { name: 'The Other Team 03 Name', desc : ['Ownership.yaml']},
                { name: "FTEnvTeam_Main", desc: ["FTestInventory category scrumteam"]}
              ],
              ownersPartial: [
                { name: 'Team_02', desc: ['ScrumTeam method annotation'] }
              ],
              partialIN_DEV: [
                "testFirstMethod_01"
              ]
            },
            methodsInfo: {
              'testFirstMethod_01': {
                IN_DEV: true,
                labels: [
                  { name: 'IgnoreFailureReason.IN_DEV', desc: ['TestLabel method annotation'] }
                ],
                name: 'testFirstMethod_01',
                owners: []
              },
              'testSecondMethod_02': {
                labels: [
                  { name: 'IgnoreFailureReason.Label1', desc: ['TestLabel method annotation']},
                  { name: 'IgnoreFailureReason.Label2', desc: ['TestLabel method annotation']}
                ],
                name: 'testSecondMethod_02',
                owners: [
                  { name: 'Team_02', desc: ['ScrumTeam method annotation']}
                ]
              }
            }
          });
        });
    });
  });
  describe('#iterateProject()', function() {
    it('empty project folder', function () {
      let rootFolder = './test-projects/empty';
      addedFoldersIntoScanFile = [];
      let runInfo = {
        rootFolder,
        // place to store report files
        reportFolder: undefined,
        // handler to react on report created for file
        onReportGenerated: undefined,
        rescan: false,
        module: undefined,
        onFolderProcessed: status => runInfo.foldersProcessedList.push(status.currentPath),
        foldersProcessedList: []
      };

      return expect(
        projectIndexer.iterateProject(runInfo)
      ).to.eventually.be.fulfilled
        .then((result) => {
          assert.deepEqual(result, {
            foldersProcessedAlready: new Set([]),
            foldersProcessed: 0,
            foldersProcessedList: [],
            rootFolder: './test-projects/empty',
            rootFoldersDetected: 0,
            rootFilesDetected: 0,
            lastScanFile: 'lastScan.log',
            reportFolder: undefined,
            rescan: false,
            module: undefined,
            errors: [],
            success: true
          });
          assert.deepEqual(addedFoldersIntoScanFile, []);
        });
    });
    it('small project folder', function () {
      let rootFolder = './test-projects/small';
      addedFoldersIntoScanFile = [];
      let runInfo = {
        rootFolder,
        rescan: true,
        // place to store report files
        reportFolder: undefined,
        // handler to react on report created for file
        onReportGenerated: undefined,
        onFolderProcessed: status => runInfo.foldersProcessedList.push(status.currentPath),
        foldersProcessedList: []
      };
      return expect(
        projectIndexer.iterateProject(runInfo)
      ).to.eventually.be.fulfilled
        .then((result) => {
          assert.deepEqual(result, {
            foldersProcessedAlready: new Set([]),
            foldersProcessed: 7,
            foldersProcessedList: [
              "folder_02",
              "folder_02/java",
              "folder_02/java/src",
              "folder_02/java/src/package_02_01",
              "folder_01",
              "folder_01/java",
              "folder_01/java/src"            ],
            rescan: true,
            rootFolder: './test-projects/small',
            rootFoldersDetected: 2,
            rootFilesDetected: 0,
            lastScanFile: 'lastScan.log',
            reportFolder: undefined,
            errors: [],
            success: true
          });
          assert.deepEqual(addedFoldersIntoScanFile, ['folder_02', 'folder_01']);
        });
    });
    it('small project folder with Preprocessed folders', function () {
      let rootFolder = './test-projects/smallPartial';
      addedFoldersIntoScanFile = [];
      let runInfo = {
        rootFolder,
        rescan: false,
        // place to store report files
        reportFolder: undefined,
        // handler to react on report created for file
        onReportGenerated: undefined,
        onFolderProcessed: status => runInfo.foldersProcessedList.push(status.currentPath),
        foldersProcessedList: []
      };
      return expect(
        projectIndexer.iterateProject(runInfo)
      ).to.eventually.be.fulfilled
        .then((result) => {
          assert.deepEqual(result, {
            foldersProcessedAlready: new Set(['folder_01']),
            foldersProcessed: 4,
            foldersProcessedList: [
              "folder_02",
              "folder_02/java",
              "folder_02/java/src",
              "folder_02/java/src/package_02_01"
            ],
            lastScanFound: true,
            rescan: false,
            rootFolder: './test-projects/smallPartial',
            rootFoldersDetected: 2,
            rootFilesDetected: 1,
            lastScanFile: 'lastScan.log',
            reportFolder: undefined,
            errors: [],
            success: true
          });
          assert.deepEqual(addedFoldersIntoScanFile, ['folder_02']);
        });
    });
    it('big project folder', function () {
      let rootFolder = './test-projects/big';
      addedFoldersIntoScanFile = [];
      let runInfo = {
        rootFolder,
        // place to store report files
        reportFolder: undefined,
        // handler to react on report created for file
        onReportGenerated: undefined,
        onFolderProcessed: status => runInfo.foldersProcessedList.push(status.currentPath),
        foldersProcessedList: []
      };
      return expect(
        projectIndexer.iterateProject(runInfo)
      ).to.eventually.be.fulfilled
        .then((result) => {
          assert.deepEqual(result, {
            rootFolder: './test-projects/big',
            rootFoldersDetected: 0,
            rootFilesDetected: 0,
            foldersProcessedAlready: new Set([]),
            foldersProcessed: 0,
            foldersProcessedList: [],
            lastScanFile: 'lastScan.log',
            reportFolder: undefined,
            errors: [],
            success: true
          });
          assert.deepEqual(addedFoldersIntoScanFile, []);
        });
    });
  });
});
