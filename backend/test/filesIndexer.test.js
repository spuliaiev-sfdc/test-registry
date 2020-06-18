var
  assert = require('assert'),
  utils = require('../src/corUtils.js')
    // This is just to set logging to warnings level
    .warningsOnly(),
  filesIndexer = require('../src/filesIndexer');

function defaultCallBacks() {
  let callbacksContext = {
    filesProcessed: [],
    foldersProcessed: [],
    errors: []
  }
  callbacksContext.callbackFile = (status, relativePath, fileName) => {
    utils.info(` File ${status.filesProcessed} ${fileName} in ${relativePath}`);
    callbacksContext.filesProcessed.push(relativePath);
  };

  callbacksContext.callbackFolder = (status, operation) => {
    utils.info(`Folder ${status.foldersProcessed}, left:  ${status.foldersListToProcess.length}, operation: ${operation} for ${status.currentPath}`);
    if (operation === 'finish') {
      callbacksContext.foldersProcessed.push(status.currentPath);
    }
    return true;
  };
  callbacksContext.callbackErr = (status, errorCode, path, ex) => {
    utils.error(`Error ${errorCode} for ${path}`);
    callbacksContext.errors.push(`Error ${errorCode} for ${path}`);
  };
  return callbacksContext;
}

describe('filesIndexer', function() {
  describe('#iterateFiles() - Small project', function() {
    it('should successfully iterate small project', function() {
      let path = './test-projects/small';
      let concurrency = 1;
      let executionStatus = defaultCallBacks();
      filesIndexer.iterateFiles(path, executionStatus.callbackFile, executionStatus.callbackFolder, executionStatus.callbackErr, concurrency);
      assert.equal(executionStatus.filesProcessed.length, 5);
      assert.equal(executionStatus.foldersProcessed.length, 4);
      assert.equal(executionStatus.errors.length, 0);
    });
  });
  describe('#iterateFiles() - Not found project folder', function() {
    it('should successfully iterate absent project', function() {
      let path = './test-projects/absent';
      let concurrency = 1;
      let executionStatus = defaultCallBacks();
      filesIndexer.iterateFiles(path, executionStatus.callbackFile, executionStatus.callbackFolder, executionStatus.callbackErr, concurrency);
      assert.equal(executionStatus.filesProcessed.length, 0);
      assert.equal(executionStatus.foldersProcessed.length, 0);
      assert.equal(executionStatus.errors.length, 1);
    });
  });
});
