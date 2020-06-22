var
  assert = require('assert'),
  utils = require('../src/corUtils.js')
    // This is just to set logging to warnings level
    .warningsOnly(),
  projectIndexer = require('../src/projectIndexer');

// Override the ScanFile updates to save into array to do not break the testing folder structure and content
let addedFoldersIntoScanFile = [];
projectIndexer.addProcessedFolderToScanFile = (processedFolderName) => {
  addedFoldersIntoScanFile.push(processedFolderName);
}

// Test Suites
describe('projectIndexer', function() {
  describe('#iterateProject()', function() {
    it('empty project folder', function () {
      let rootFolder = './test-projects/empty';
      addedFoldersIntoScanFile = [];
      let result = projectIndexer.iterateProject(rootFolder);
      assert.deepEqual(result, {
        'foldersProcessedAlready': new Set([]),
        'foldersProcessed': [],
        'rootFolder': './test-projects/empty',
        'rootFoldersDetected': 0,
        'rootFilesDetected': 0,
        'lastScanFile': 'lastScan.log',
        errors: [],
      });
      assert.deepEqual(addedFoldersIntoScanFile, []);
    });
    it('small project folder', function () {
      let rootFolder = './test-projects/small';
      addedFoldersIntoScanFile = [];
      let result = projectIndexer.iterateProject(rootFolder);
      assert.deepEqual(result, {
        'foldersProcessedAlready': new Set([]),
        'foldersProcessed': [
          'folder_02',
          'folder_02/java',
          'folder_02/java/src',
          'folder_02/java/src/package_02_01',
          'folder_01',
          'folder_01/java',
          'folder_01/java/src'
        ],
        'rootFolder': './test-projects/small',
        'rootFoldersDetected': 2,
        'rootFilesDetected': 0,
        'lastScanFile': 'lastScan.log',
        errors: [],
      });
      assert.deepEqual(addedFoldersIntoScanFile, ['folder_02', 'folder_01']);
    });
    it('small project folder with Preprocessed folders', function () {
      let rootFolder = './test-projects/smallPartial';
      addedFoldersIntoScanFile = [];
      let result = projectIndexer.iterateProject(rootFolder);
      assert.deepEqual(result, {
        'foldersProcessedAlready': new Set(['folder_01']),
        'foldersProcessed': [
          'folder_02',
          'folder_02/java',
          'folder_02/java/src',
          'folder_02/java/src/package_02_01'
        ],
        'lastScanFound': true,
        'rootFolder': './test-projects/smallPartial',
        'rootFoldersDetected': 2,
        'rootFilesDetected': 1,
        'lastScanFile': 'lastScan.log',
        errors: [],
      });
      assert.deepEqual(addedFoldersIntoScanFile, ['folder_02']);
    });
    it('big project folder', function () {
      let rootFolder = './test-projects/big';
      addedFoldersIntoScanFile = [];
      let result = projectIndexer.iterateProject(rootFolder);
      assert.deepEqual(result, {
        'rootFolder': './test-projects/big',
        'rootFoldersDetected': 0,
        'rootFilesDetected': 0,
        'foldersProcessedAlready': new Set([]),
        'foldersProcessed': [],
        'lastScanFile': 'lastScan.log',
        errors: [],
      });
      assert.deepEqual(addedFoldersIntoScanFile, []);
    });
  });
});
