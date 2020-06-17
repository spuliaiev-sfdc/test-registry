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
    let rootFoldersCount = 0;
    let rootFilesCount = 0;
    let foldersProcessedAlready = new Set();

    let lastScanFile = "lastScan.log";
    if (fs.existsSync(lastScanFile)) {
      runInfo.lastScanFound = true;
      fs.readFileSync(lastScanFile, "UTF-8").toString().split("\n").map(line => {
        let trimmed = line.trim();
        if (trimmed.length > 0) {
          foldersProcessedAlready.add(trimmed);
        }
      });
      runInfo.lastScanProcessed = foldersProcessedAlready;
    }

    let entries = fs.readdirSync(rootFolder);
    for(let i=0; i<entries.length; i++) {
      let path = resolve(rootFolder, entries[i]);
      let stats;
      try {
        stats = fs.statSync(path);
      } catch (ex) {
      }
      if (stats.isDirectory()) {
        rootFoldersCount++;
      } else {
        rootFilesCount++;
      }
    }
    runInfo.rootFoldersDetected = rootFoldersCount;
    runInfo.rootFilesDetected = rootFilesCount;

    return runInfo;
  }
};

module.exports = projectIndexer;
