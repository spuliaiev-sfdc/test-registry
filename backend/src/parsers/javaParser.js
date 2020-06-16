const
  jp = require('jsonpath'),
  parser = require("java-parser");

const javaParser = {

  parseJavaContent(fileContent) {
    let content = parser.parse(fileContent);
    let classes = this.extractClassesInfo(content);
    return { status: 'success', content };
  },

  extractClassesInfo(content) {
    let classesInfo = {};
    classesInfo.classes = [];
    let res = jp.query(content, '$[?(@.name=="typeIdentifier")]');


    return classesInfo;
  }
};


module.exports = javaParser;
