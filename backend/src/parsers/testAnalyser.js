const
  resolve = require('path').resolve,
  fs = require('fs'),
  corUtil = require("../corUtils"),
  javaParser = require("./javaParser");

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
    let fileFullPath = resolve(fileInfo.rootFolder, fileInfo.relative);
    let javaClassContent = fs.readFileSync(fileFullPath, "UTF-8").toString();
    let parsingResult = javaParser.parseJavaContent(javaClassContent);
    if(parsingResult.status === 'success') {
      corUtil.info(`[analyseJavaTestFile] succeeded file analysis ${fileInfo.relative} Error: ${parsingResult.status}`);
    } else {
      corUtil.error(`[analyseJavaTestFile] failed file analysis ${fileInfo.relative} Error: ${parsingResult.status}`);
    }

    corUtil.info(`[analyseJavaTestFile] finished file analysis ${fileInfo.relative}`);
  },

  analyseOwnershipFile(fileInfo) {
    corUtil.info(`[analyseJavaTestFile] started Ownership file analysis for ${fileInfo.relative}`);
    corUtil.trace(`[analyseJavaTestFile]  Ownership file ${fileInfo.ownershipFilePath}`);
    if (!fs.existsSync(fileInfo.ownershipFilePath)) {
      corUtil.error(`[analyseJavaTestFile]  Ownership file not found ${fileInfo.ownershipFilePath}`);
      return false;
    }

  }
};


module.exports = testAnalyser;
