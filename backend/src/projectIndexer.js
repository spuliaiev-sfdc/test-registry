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
    runInfo.foldersToProcess = new Set();

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
        if (!runInfo.foldersProcessedAlready.has(entries[i])) {
          runInfo.foldersToProcess.add(entries[i]);
        } else {
          utils.trace(`  folder ${entries[i]} is skipped as already processed`);
        }
      } else {
        runInfo.rootFilesDetected++;
      }
    }
    utils.trace(` Root folder scan done`);
  }
};

module.exports = projectIndexer;
