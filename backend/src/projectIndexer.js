const
  fs = require('fs'),
  resolve = require('path').resolve,
  utils = require('./corUtils.js'),
  testAnalyser = require('./parsers/testAnalyser'),
  fTestInventory = require('./utils/ftestInventory'),
  fTestInventoryRecord = require('./storage/data/fTestInventoryRecord'),
  filesIndexer = require('./filesIndexer');

const projectIndexer = {

  iterateProject(runInfo) {
    this.prepareRootFolderInfo(runInfo);
    utils.info("Execution information", runInfo);

    fTestInventory.enumerateAllTests(runInfo);

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
    runInfo.foldersProcessed = 0;
    runInfo.errors = [];

    runInfo.lastScanFile = "lastScan.log";
    let lastScanFileFullPath = resolve(runInfo.rootFolder, runInfo.lastScanFile);
    if (fs.existsSync(lastScanFileFullPath)) {
      utils.info(` lastScan.log file is found in the folder will be excluded from reindex. remove the file if full scan needed`);
      if (runInfo.rescan) {
        utils.info(` lastScan.log file is ignored because of rescan option`);
      } else {
        runInfo.lastScanFound = true;
        fs.readFileSync(lastScanFileFullPath, "UTF-8").toString().split("\n").map(line => {
          let trimmed = line.trim();
          if (trimmed.length > 0) {
            runInfo.foldersProcessedAlready.add(trimmed);
          }
        });
      }
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
          continue;
        }
        if (runInfo.module && runInfo.module !== entries[i]) {
          utils.trace(`  folder ${entries[i]} is skipped as not the one requested`);
          continue;
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

      let fileInfo = testAnalyser.verifyFileIsTest(runInfo.rootFolder, relativePath);
      if (fileInfo.testFile) {
        utils.info(` File ${status.filesProcessed+1} ${relativePath} is Test`);
        this.runFileAnalysis(runInfo, status, fileInfo);
        status.filesProcessed++;
      } else {
        utils.trace(` File ${status.filesProcessed} ${relativePath} is skipped as not Test`);
      }
    };

    this.callbackOnFolder = (status, operation) => {
      if (operation === 'start') {
        // processing of the root folder - always true
        if (status.currentPath === '.') { return true; }

        let pathParts = status.currentPath.split('/');

        // verify that this folder has not yet been processed
        let needsToBeProcessed = !runInfo.foldersProcessedAlready.has(status.currentPath);
        if (needsToBeProcessed && runInfo.module && pathParts[0] !== runInfo.module) {
          needsToBeProcessed = false;
        }
        if (needsToBeProcessed) {
          utils.info(`Folder processing ${status.foldersProcessed} / ${status.foldersListToProcess.length} : ${status.currentPath}`);
        } else {
          utils.trace(`Folder skipped    ${status.foldersProcessed} / ${status.foldersListToProcess.length} : ${status.currentPath}`);
        }
        return needsToBeProcessed;
      }
      if (operation === 'finish') {
        utils.info(`Folder ${status.foldersProcessed} processed, left:  ${status.foldersListToProcess.length}, operation: ${operation} for ${status.currentPath}`);
        if(status.currentPath !== ".") {
          // Do not store the current folder in the list of processed folders
          runInfo.foldersProcessed++;
          // Append the current processed ROOT folder into the list of processed folders in last sync file
          if (!status.currentPath.includes("/")) {
            this.addProcessedFolderToScanFile(runInfo, status.currentPath);
          }
        }
      }
    };

    this.callbackOnError = (status, errorCode, path, ex) => {
      console.error(`Error ${errorCode} for ${path}`, ex);
      runInfo.errors.push(`Error ${errorCode} for ${path}`);
    };

    filesIndexer.iterateFiles(runInfo.rootFolder, this.callbackOnFile, this.callbackOnFolder, this.callbackOnError, 1);

    utils.trace(` Root folder iteration done`);
  },

  async runFileAnalysis(runInfo, status, fileInfo) {
    utils.trace(` File analysis start ${fileInfo.relative}`);
    if (fileInfo.lang === "java") {
      testAnalyser.analyseJavaTestFile(fileInfo);

      await this.populateOwnershipFileInformation(runInfo, fileInfo);

      await this.populateFTestInventoryFileInformation(runInfo, fileInfo);

      fileInfo.report = testAnalyser.writeReport(fileInfo, runInfo.reportFolder);
      if (runInfo.onReportGenerated) {
        runInfo.onReportGenerated(fileInfo);
      }
    }

    utils.trace(` File analysis end ${fileInfo.relative}`);
    return fileInfo;
  },

  addProcessedFolderToScanFile(runInfo, currentPath) {
    let lastScanFileFullPath = resolve(runInfo.rootFolder, runInfo.lastScanFile);
    fs.appendFileSync(lastScanFileFullPath, currentPath+"\n");
  },

  async populateOwnershipFileInformation(runInfo, fileInfo) {
    if (!runInfo.cachedOwnershipFile) {
      // init the caching for ownership file
      runInfo.cachedOwnershipFile = {};
    }
    testAnalyser.analyseOwnershipFile(fileInfo, runInfo.cachedOwnershipFile);
  },

  async populateFTestInventoryFileInformation(runInfo, fileInfo) {
    if (runInfo.database) {
      // If DB is available - read the data from database
      let invRecord = await fTestInventoryRecord.findByClassName(fileInfo.javaClassFQN);
      if (invRecord) {
        fileInfo.fTestInventoryInfo = invRecord;
      }
    } else {
      if (!runInfo.cachedInventoryFile) {
        // init the caching for ownership file
        runInfo.cachedInventoryFile = {};
      }
      testAnalyser.analyseFTestInventoryFile(fileInfo, runInfo.cachedInventoryFile);
    }
  }
};

module.exports = projectIndexer;
