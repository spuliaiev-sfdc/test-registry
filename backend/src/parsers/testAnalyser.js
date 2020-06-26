const
  resolve = require('path').resolve,
  fs = require('fs'),
  corUtil = require("../corUtils"),
  yaml = require('yaml'),
  javaParser = require("./javaParser"),
  fTestInventoryFileUtil = require("../utils/ftestInventory"),
  ownersFileUtil = require("../utils/ownersFileUtil");

const testAnalyser = {

  verifyFileIsTest(rootFolder, relativeFileName) {
    let fileInfo = corUtil.analyseFileLocation(rootFolder, relativeFileName);
    fileInfo.testFile = false;
    fileInfo.lang = "unknown";

    if (fileInfo.ext.toLowerCase() === "java") {
      fileInfo.lang = "java";
    }
    if (fileInfo.ext.toLowerCase() === "js") {
      fileInfo.lang = "javascript";
    }

    if (fileInfo.lang === "java" && fileInfo.filename.toLowerCase().endsWith("test")) {
      fileInfo.testFile = true;
    }

    if (fileInfo.lang === "javascript" && fileInfo.filename.toLowerCase().endsWith("test")) {
      fileInfo.testFile = true;
    }

    return fileInfo;
  },

  analyseJavaTestFile(fileInfo) {
    corUtil.info(`[analyseJavaTestFile] started Java file analysis ${fileInfo.relative}`);
    let fileFullPath = resolve(fileInfo.root, fileInfo.relative);
    let javaClassContent = fs.readFileSync(fileFullPath, "UTF-8").toString();
    let parsingResult = javaParser.parseJavaContent(javaClassContent);
    if(parsingResult.success === true) {
      corUtil.info(`[analyseJavaTestFile] succeeded file analysis ${fileInfo.relative} Error: ${parsingResult.success}`);
    } else {
      corUtil.error(`[analyseJavaTestFile] failed file analysis ${fileInfo.relative} Error: ${parsingResult.success}`);
    }
    fileInfo.javaInfo = parsingResult;

    corUtil.info(`[analyseJavaTestFile] finished file analysis ${fileInfo.relative}`);
    return parsingResult;
  },

  writeReport(fileInfo, reportFolder) {
    let reportObject = this.renderReport(fileInfo);
    if (reportFolder) {
      let reportFile = resolve(reportFolder, fileInfo.filename + ".json");
      let reportText = yaml.stringify(reportObject);
      fs.writeFileSync(reportFile, reportText);
    }
    return reportObject;
  },

  renderReport(fileInfo) {
    let report = {};
    Object.assign(report, fileInfo.javaInfo.javaOwnershipInfo);

    report.class = fileInfo.javaClassFQN;
    report.module = fileInfo.moduleRoot;

    if (fileInfo.ownershipFile && fileInfo.ownershipFile.owningTeam) {
      // copy information into target owners
      corUtil.addTagInfo(report.classInfo.owners, fileInfo.ownershipFile.owningTeam, "Ownership.yaml");
    }

    if (fileInfo.fTestInventoryInfo && fileInfo.fTestInventoryInfo.found) {
      // copy information into target owners
      corUtil.addTagInfo(report.classInfo.owners, fileInfo.fTestInventoryInfo.testInfo.owners);
    }

    return report;
  },

  analyseOwnershipFile(fileInfo, cachedOwnershipFile) {
    corUtil.info(`[analyseJavaTestFile] started Ownership file analysis for ${fileInfo.relative}`);
    return ownersFileUtil.getFileOwningTeam(fileInfo, cachedOwnershipFile);
  },

  analyseFTestInventoryFile(fileInfo, cachedInventoryFile) {
    corUtil.info(`[analyseJavaTestFile] FTestInventory file analysis for ${fileInfo.relative}`);
    fTestInventoryFileUtil.getTestOwningTeam(fileInfo, cachedInventoryFile);
    return fileInfo.fTestInventoryInfo;
  }
};


module.exports = testAnalyser;
