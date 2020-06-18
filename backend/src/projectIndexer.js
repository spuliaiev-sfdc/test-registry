const
  fs = require('fs'),
  resolve = require('path').resolve,
  utils = require('./corUtils.js'),
  testAnalyser = require('./parsers/testAnalyser'),
  filesIndexer = require('./filesIndexer');

const projectIndexer = {

  iterateProject(rootFolder) {
    let runInfo = {
      rootFolder
    };
    this.prepareRootFolderInfo(runInfo);
    utils.info("Execution information", runInfo);

    this.iterateRootFolder(runInfo);

    return runInfo;
  },

  /**
   * Prepare root folder information about modules and files.
   * Read the lastScan.log file and remove already processed modules.
   */
  prepareRootFolderInfo(runInfo) {
    utils.trace(` Root folder scan started`);
    runInfo.rootFoldersDetected = 0;
    runInfo.rootFilesDetected = 0;
    runInfo.foldersProcessedAlready = new Set();
    runInfo.foldersProcessed = [];

    let lastScanFile = resolve(runInfo.rootFolder, "lastScan.log");
    if (fs.existsSync(lastScanFile)) {
      utils.info(` lastScan.log file is found in the folder will be excluded from reindex. remove the file if full scan needed`);
      runInfo.lastScanFound = true;
      fs.readFileSync(lastScanFile, "UTF-8").toString().split("\n").map(line => {
        let trimmed = line.trim();
        if (trimmed.length > 0) {
          runInfo.foldersProcessedAlready.add(trimmed);
        }
      });
    } else {
      utils.trace(` lastScan.log file is not found in the folder`);
    }

    let entries = fs.readdirSync(runInfo.rootFolder);
    for(let i=0; i<entries.length; i++) {
      let path = resolve(runInfo.rootFolder, entries[i]);
      let stats;
      try {
        stats = fs.statSync(path);
      } catch (ex) {
      }
      if (stats.isDirectory()) {
        runInfo.rootFoldersDetected++;
        if (runInfo.foldersProcessedAlready.has(entries[i])) {
          utils.trace(`  folder ${entries[i]} is skipped as already processed`);
        }
      } else {
        runInfo.rootFilesDetected++;
      }
    }
    utils.trace(` Root folder scan done`);
  },

  iterateRootFolder(runInfo) {
    utils.trace(` Root folder iteration start`);

    this.callbackOnFile = (status, relativePath, fileName) => {
      utils.trace(` File ${status.filesProcessed} ${fileName} in ${relativePath}`);
      // callbacksContext.filesProcessed.push(fileName);
      if (testAnalyser.verifyFileIsTest(runInfo.rootFolder, relativePath)) {
        status.filesProcessed++;
        utils.info(` File ${status.filesProcessed} ${relativePath} is Test`);
      } else {
        utils.trace(` File ${status.filesProcessed} ${relativePath} is skipped as not Test`);
      }
    };

    this.callbackOnFolder = (status, operation) => {
      if (operation === 'start') {
        // verify that this folder has not yet been processed
        let needsToBeProcessed = !runInfo.foldersProcessedAlready.has(status.currentPath);
        if (needsToBeProcessed) {
          utils.info(`Folder processing ${status.foldersProcessed} / ${status.foldersListToProcess} : ${status.currentPath}`);
        } else {
          utils.trace(`Folder skipped    ${status.foldersProcessed} / ${status.foldersListToProcess} : ${status.currentPath}`);
        }
        return needsToBeProcessed;
      }
      if (operation === 'finish') {
        utils.info(`Folder ${status.foldersProcessed} processed, left:  ${status.foldersListToProcess.length}, operation: ${operation} for ${status.currentPath}`);
        if(status.currentPath !== ".") {
          // Do not store the current folder in the list of processed folders
          runInfo.foldersProcessed.push(status.currentPath);
        }
      }
    };

    this.callbackOnError = (status, errorCode, path, ex) => {
      console.error(`Error ${errorCode} for ${path}`, ex);
      status.errors.push(`Error ${errorCode} for ${path}`);
    };

    filesIndexer.iterateFiles(runInfo.rootFolder, this.callbackOnFile, this.callbackOnFolder, this.callbackOnError, 1);

    utils.trace(` Root folder iteration done`);
  }
};

module.exports = projectIndexer;
