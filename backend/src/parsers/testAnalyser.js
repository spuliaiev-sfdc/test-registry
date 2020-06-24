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

  analyseOwnershipFile(fileInfo) {
    corUtil.info(`[analyseJavaTestFile] started Ownership file analysis for ${fileInfo.relative}`);
    corUtil.trace(`[analyseJavaTestFile]  Ownership file ${fileInfo.ownershipFilePath}`);
    return ownersFileUtil.getFileOwningTeam(fileInfo);
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

  addOwnersInfo(ownersCollection, teamName, sourceDescription) {
    if (Array.isArray(sourceDescription)) {
      // If array - process one by one
      sourceDescription.each( description => this.addOwnersInfo(ownersCollection, teamName, description) );
      return;
    }
    // If one - process the addition
    let existingTeam = ownersCollection[teamName];
    if (!existingTeam) {
      ownersCollection[teamName] = [sourceDescription];
    } else {
      ownersCollection[teamName].push(sourceDescription);
    }
  },

  renderReport(fileInfo) {
    let report = {};
    Object.assign(report, fileInfo.javaInfo.javaOwnershipInfo);

    report.class = fileInfo.javaClassFQN;
    report.module = fileInfo.moduleRoot;

    if (fileInfo.ownershipFile.owningTeam) {
      // copy information into target owners
      this.addOwnersInfo(report.classInfo.owners, fileInfo.ownershipFile.owningTeam, "Ownership.yaml");
    }

    if (fileInfo.fTestInventoryInfo.found) {
      // copy information into target owners
      this.addOwnersInfo(report.classInfo.owners, fileInfo.fTestInventoryInfo.owners);
    }

    return report;
  },
  analyseFTestInventoryFile(fileInfo) {
    corUtil.info(`[analyseJavaTestFile] started FTestInventory file analysis ${fileInfo.relative}`);

    let inventoryFile = fTestInventoryFileUtil.readAndVerifyInventoryFile(fileInfo);
    if(inventoryFile.success === true) {
      corUtil.info(`[analyseJavaTestFile] succeeded file analysis ${fileInfo.relative} Error: ${inventoryFile.success}`);
      fileInfo.fTestInventoryInfo = {
        inventoryFile,
        found: false
      };
      let inventoryInfo = fTestInventoryFileUtil.findTheTestClassCategory(fileInfo.fTestInventoryInfo.inventoryFile, fileInfo.javaClassFQN);
      fileInfo.fTestInventoryInfo.category = inventoryInfo;
      fileInfo.fTestInventoryInfo.found = inventoryInfo.success;
    } else {
      corUtil.error(`[analyseJavaTestFile] failed file analysis ${fileInfo.relative} Error: ${inventoryFile.success}`);
      fileInfo.fTestInventoryInfo = {
        found: false
      };
    }

    corUtil.info(`[analyseJavaTestFile] finished FTestInventory file analysis ${fileInfo.relative}`);
    return fileInfo.fTestInventoryInfo;
  }
};


module.exports = testAnalyser;
