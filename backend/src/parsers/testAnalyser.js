const
  resolve = require('path').resolve,
  fs = require('fs'),
  path = require('path'),
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
    corUtil.trace(`[analyseJavaTestFile] started Java file analysis ${fileInfo.relative}`);
    let fileFullPath = resolve(fileInfo.root, fileInfo.relative);
    let javaClassContent = fs.readFileSync(fileFullPath, "UTF-8").toString();
    let parsingResult;
    try {
      parsingResult = javaParser.parseJavaContent(javaClassContent, fileInfo);
      if (parsingResult.success === true) {
        corUtil.trace(`[analyseJavaTestFile] succeeded file analysis ${fileInfo.relative} Error: ${parsingResult.success}`);
      } else {
        corUtil.error(`[analyseJavaTestFile] failed file analysis ${fileInfo.relative} Error: ${parsingResult.success}`);
      }
      fileInfo.javaInfo = parsingResult;
    } catch (e) {
      corUtil.error(`Failed parsing of java file ${fileInfo.relative}`, e);
    }

    corUtil.trace(`[analyseJavaTestFile] finished file analysis ${fileInfo.relative}`);
    return parsingResult;
  },

  writeReport(fileInfo, reportFolder) {
    let reportObject = this.renderReport(fileInfo);
    if (reportFolder) {
      let reportFolderForModule = path.join(reportFolder, fileInfo.module);
      fs.mkdirSync(reportFolderForModule, {recursive: true});
      let reportFileYaml = resolve(reportFolderForModule, fileInfo.filename + ".yaml");
      let reportTextYaml = yaml.stringify(reportObject);
      fs.writeFileSync(reportFileYaml, reportTextYaml);

      // let reportFileJson = resolve(reportFolder, fileInfo.filename + ".json");
      // let reportTextJson = JSON.stringify(reportObject, null, 2);
      // fs.writeFileSync(reportFileJson, reportTextJson);
    }
    return reportObject;
  },

  renderReport(fileInfo) {
    let report = {};
    if (fileInfo.javaInfo && fileInfo.javaInfo.javaOwnershipInfo) {
      Object.assign(report, fileInfo.javaInfo.javaOwnershipInfo);
    }

    report.class = fileInfo.javaClassFQN;
    report.module = fileInfo.moduleRoot;
    report.testKind = fileInfo.testKind;
    report.relative = fileInfo.relative;

    if (fileInfo.ownershipFile && fileInfo.ownershipFile.owningTeam && report.classInfo) {
      if (report.classInfo) {
        // copy information into target owners
        corUtil.addTagInfo(report.classInfo.owners, fileInfo.ownershipFile.owningTeam, "Ownership.yaml");
      } else {
        corUtil.warn(`Attempt to add ownership info to non-Java class ${fileInfo.relative}`);
      }
    }

    if (fileInfo.fTestInventoryInfo && fileInfo.fTestInventoryInfo.found) {
      if (report.classInfo) {
        // copy information into target owners
        corUtil.addTagInfo(report.classInfo.owners, fileInfo.fTestInventoryInfo.testInfo.owners);
      } else {
        corUtil.warn(`Attempt to add fTestInventory to non-Java class ${fileInfo.relative}`);
      }
    }

    return report;
  },

  analyseOwnershipFile(fileInfo, cachedOwnershipFile) {
    corUtil.trace(`[analyseJavaTestFile] started Ownership file analysis for ${fileInfo.relative}`);
    return ownersFileUtil.getFileOwningTeam(fileInfo, cachedOwnershipFile);
  },

  analyseFTestInventoryFile(fileInfo, cachedInventoryFile) {
    corUtil.trace(`[analyseJavaTestFile] FTestInventory file analysis for ${fileInfo.relative}`);
    fTestInventoryFileUtil.getTestOwningTeam(fileInfo, cachedInventoryFile);
    return fileInfo.fTestInventoryInfo;
  }
};


module.exports = testAnalyser;
