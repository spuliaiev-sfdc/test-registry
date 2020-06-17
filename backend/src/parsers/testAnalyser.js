const
  jp = require('jsonpath'),
  corUtil = require("../corUtils"),
  javaParser = require("./javaParser");

const testAnalyser = {

  verifyFileIsTest(rootFolder, relativeFileName, fileContent) {
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

    return fileInfo.testFile;
  }

};


module.exports = testAnalyser;
