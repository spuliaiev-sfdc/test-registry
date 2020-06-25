const
  fs = require('fs'),
  readline = require('readline'),
  resolve = require('path').resolve,
  relative = require('path').relative,
  xmlParser = require('fast-xml-parser'),
  he = require('he'),
  corUtils = require('../corUtils.js');

let options = {
  attributeNamePrefix: "",
  // attributeNamePrefix : "@_",
  attrNodeName: "attr", //default is 'false'
  textNodeName: "#text",
  ignoreAttributes: false,
  // ignoreNameSpace : false,
  allowBooleanAttributes: false,
  parseNodeValue: true,
  parseAttributeValue: true,
  trimValues: true,
  format: true,
  indentBy: "  ",
  cdataTagName: "__cdata", //default is 'false'
  cdataPositionChar: "\\c",
  parseTrueNumberOnly: false,
  arrayMode: false, //"strict"
  attrValueProcessor: (val, attrName) => he.decode(val, {isAttributeValue: true, useNamedReferences: true}),//default is a=>a
  tagValueProcessor: (val, tagName) => he.decode(val), //default is a=>a
  stopNodes: ["parse-me-as-string"]
};

const fTestInventoryFileUtil = {

  findInventoryFile(moduleRootFolder) {
    let files;
    try {
      files = fs.readdirSync(moduleRootFolder);
    } catch (ex) {
      corUtils.error(`Folder read error ${moduleRootFolder}`, ex);
      return;
    }
    for (let i = 0; i < files.length; i++) {
      if (files[i].toLowerCase().endsWith(".xml")) {
        let foundFilePath = resolve(moduleRootFolder, files[i]);
        const fileContent = fs.readFileSync(foundFilePath, 'utf8');
        if (fileContent.includes("<ftests ")) {
          return {fileName: relative(moduleRootFolder, foundFilePath), fileContent};
        }
      }
    }
    return null;
  },

  readAndVerifyInventoryFile: function (fileInfo) {
    let inventoryFile = this.findInventoryFile(resolve(fileInfo.root, fileInfo.moduleRoot));
    if (!inventoryFile) {
      corUtils.error(`     FTestInventory file not found ${fileInfo.moduleRoot}`)
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
      corUtils.error(`     FTestInventory file is empty ${inventoryFile.fileName}`)
      result.errors.push(`FTestInventory file is empty: ${inventoryFile.fileName}`);
      result.success = false;
      return result;
    }
    result.filename = inventoryFile.fileName;
    if (!xmlParser.validate(fileContent)) { //optional (it'll return an object in case it's not valid)
      corUtils.error(`     FTestInventory file is wrong ${inventoryFile.fileName}`)
      result.errors.push(`FTestInventory file is wrong: ${inventoryFile.fileName}`);
      result.success = false;
      return result;
    }
    let currentOwnersFileContent = xmlParser.parse(fileContent, options);
    if (!currentOwnersFileContent.ftests) {
      corUtils.error(`     FTestInventory file doesn't have any ftest inventory definitions!  ${inventoryFile.fileName}`)
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
      errors: [],
      found: false,
      success: false
    }
    if (!inventoryInfo || !inventoryInfo.content.ftests) {
      corUtils.error(`     FTestInventory content is wrong ${inventoryInfo.fileName}`)
      result.errors.push(`FTestInventory content is wrong: ${inventoryInfo.fileName}`);
      result.success = false;
      return result;
    }

    function appendCategoryInfo(category) {
      result.categoryElements.unshift(category.attr.name);
      if (result.categoryPath) {
        result.categoryPath = category.attr.name + '/' + result.categoryPath;
      } else {
        result.categoryPath = category.attr.name;
      }

      // only if it was not marked as owned by some other team in more precise level - on the test or underlaying category
      if (Object.keys(result.owners).length === 0 && category.attr.scrumteam) {

        corUtils.addOwnersInfo(result.owners, category.attr.scrumteam, ['FTestInventory category scrumteam']);
      }
    }

    function findTestInCategory(category) {
      if (Array.isArray(category)) {
        for (let i = 0; i < category.length; i++) {
          if (findTestInCategory(category[i])) {
            appendCategoryInfo(category[i]);
            result.found = true;
            return true;
          }
        }
        return false;
      }
      function checkClassMatching(test) {
        if (test.attr && test.attr.class === testClassName) {
          if (test.attr.scrumteam) {
            corUtils.addOwnersInfo(result.owners, test.attr.scrumteam, ['FTestInventory test scrumteam']);
          }
          return true;
        }
        return false;
      }

      if (category.test) {
        // iterate through tests to find the one we need
        if (Array.isArray(category.test)) {
          for (let i = 0; i < category.test.length; i++) {
            if (checkClassMatching(category.test[i])) {
              appendCategoryInfo(category);
              return true;
            }
          }
        } else {
          if (checkClassMatching(category.test)) {
            appendCategoryInfo(category);
            return true;
          }
        }
      }

      // search in sub categories
      if (category.category) {
        return findTestInCategory(category.category);
      }
      return false;
    }

    findTestInCategory(inventoryInfo.content.ftests);

    result.success = true;
    return result;
  }
};


module.exports = fTestInventoryFileUtil;
