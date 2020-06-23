const
  resolve = require('path').resolve,
  fs = require('fs'),
  corUtil = require("../corUtils"),
  javaParser = require("./javaParser"),
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
  }
};


module.exports = testAnalyser;
