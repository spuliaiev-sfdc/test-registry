const
  fs = require('fs'),
  readline = require('readline'),
  resolve = require('path').resolve,
  relative = require('path').relative,
  xmlParser = require('fast-xml-parser'),
  he = require('he'),
  utils = require('../corUtils.js');

let options = {
  attributeNamePrefix : "",
  // attributeNamePrefix : "@_",
  attrNodeName: "attr", //default is 'false'
  textNodeName : "#text",
  ignoreAttributes : false,
  // ignoreNameSpace : false,
  allowBooleanAttributes : false,
  parseNodeValue : true,
  parseAttributeValue : true,
  trimValues: true,
  format: true,
  indentBy: "  ",
  cdataTagName: "__cdata", //default is 'false'
  cdataPositionChar: "\\c",
  parseTrueNumberOnly: false,
  arrayMode: false, //"strict"
  attrValueProcessor: (val, attrName) => he.decode(val, {isAttributeValue: true, useNamedReferences: true}),//default is a=>a
  tagValueProcessor : (val, tagName) => he.decode(val), //default is a=>a
  stopNodes: ["parse-me-as-string"]
};

const fTestInventoryFileUtil = {

  findInventoryFile(moduleRootFolder) {
    let files;
    try {
      files = fs.readdirSync(moduleRootFolder);
    } catch (ex) {
      utils.error(`Folder read error ${moduleRootFolder}`, ex);
      return;
    }
    for (let i = 0; i < files.length; i++) {
      if (files[i].toLowerCase().endsWith(".xml")) {
        let foundFilePath = resolve(moduleRootFolder, files[i]);
        const fileContent = fs.readFileSync(foundFilePath, 'utf8');
        if (fileContent.includes("<ftests ")){
          return { fileName: relative(moduleRootFolder, foundFilePath), fileContent};
        }
      }
    }
    return null;
  },

  readAndVerifyInventoryFile: function (fileInfo) {
    let inventoryFile = this.findInventoryFile(resolve(fileInfo.root, fileInfo.moduleRoot));
    if (!inventoryFile) {
      utils.error(`     FTestInventory file not found ${fileInfo.moduleRoot}`)
      result.errors.push(`FTestInventory file not found: ${fileInfo.moduleRoot}`);
      result.success = false;
      return result;
    }
    let result = {
      content: null,
      errors: [],
      success: null
    }
    const fileContent = inventoryFile.fileContent;
    if (!fileContent || fileContent.trim().length === 0) {
      utils.error(`     FTestInventory file is empty ${inventoryFile.fileName}`)
      result.errors.push(`FTestInventory file is empty: ${inventoryFile.fileName}`);
      result.success = false;
      return result;
    }
    result.filename = inventoryFile.fileName;
    if( !xmlParser.validate(fileContent)) { //optional (it'll return an object in case it's not valid)
      utils.error(`     FTestInventory file is wrong ${inventoryFile.fileName}`)
      result.errors.push(`FTestInventory file is wrong: ${inventoryFile.fileName}`);
      result.success = false;
      return result;
    }
    let currentOwnersFileContent = xmlParser.parse(fileContent,options);
    if (!currentOwnersFileContent.ftests) {
      utils.error(`     FTestInventory file doesn't have any ftest inventory definitions!  ${inventoryFile.fileName}`)
      result.errors.push(`FTestInventory file doesn't have any ftest inventory definitions:  ${inventoryFile.fileName}`);
      result.success = false;
      return result;
    } else {
      let ownerInfo = currentOwnersFileContent.ftests;
      result.content = currentOwnersFileContent;
      result.success = true;
    }
    return result;
  },

  findTheTestClassCategory(inventoryInfo, testClassName) {
    let result = {
      owners: {},
      categoryPath: "",
      categoryElements: [],
      success: false
    }
    return result;
  }
};


module.exports = fTestInventoryFileUtil;
