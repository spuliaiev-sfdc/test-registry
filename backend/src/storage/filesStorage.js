const
  path = require('path'),
  fs = require('fs'),
  shell = require('shelljs'),
  utils = require('../corUtils.js');

const filesStorage = {
  rootFolder: null,

  async getFile(fileRelativePath) {
    let found = false;
    let content = undefined;
    if(fileRelativePath) {
      let fileFullPath = path.join(this.rootFolder, fileRelativePath);
      if (fs.existsSync(fileFullPath)) {
        found = true;
        content = fs.readFileSync(fileFullPath, "UTF-8").toString();
      }
    }
    return {
      filePath: fileRelativePath,
      success: true,
      found,
      content
    };
  }
}

module.exports = filesStorage;
