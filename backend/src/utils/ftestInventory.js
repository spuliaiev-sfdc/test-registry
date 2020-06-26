const
  fs = require('fs'),
  readline = require('readline'),
  path = require('path'),
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
          return {fileName: relative(moduleRootFolder, foundFilePath), content: fileContent};
        }
      }
    }
    return null;
  },

  readAndVerifyInventoryFile: function (fileInfo, inventoryFile) {
    let result = {
      content: null,
      errors: [],
      success: null
    }
    if (!inventoryFile) {
      corUtils.error(`     FTestInventory file not found for module ${fileInfo.moduleRoot}`)
      result.errors.push(`FTestInventory file not found for module ${fileInfo.moduleRoot}`);
      result.success = false;
      return result;
    }
    const fileContent = inventoryFile.content;
    if (!fileContent || fileContent.trim().length === 0) {
      corUtils.error(`     FTestInventory file is empty for module ${inventoryFile.moduleRoot}`)
      result.errors.push(`FTestInventory file is empty for module ${inventoryFile.moduleRoot}`);
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
      result.content = currentOwnersFileContent;
      result.success = true;
    }
    return result;
  },

  findTestOwnershipInfo(inventoryInfo, testClassName) {
    let result = {
      owners: {},
      categoryPath: "",
      categoryElements: [],
      errors: [],
      found: false,
      success: false
    }
    if (!inventoryInfo || !inventoryInfo.ftests) {
      corUtils.error(`     FTestInventory content is wrong`)
      result.errors.push(`FTestInventory content is wrong:`);
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

        corUtils.addTagInfo(result.owners, category.attr.scrumteam, ['FTestInventory category scrumteam']);
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
            corUtils.addTagInfo(result.owners, test.attr.scrumteam, ['FTestInventory test scrumteam']);
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

    result.found = findTestInCategory(inventoryInfo.ftests);
    // not failed, so always success
    result.success = true;
    return result;
  },

  getTestOwningTeam(fileInfo, cachedInventoryFile) {
    let result = {
      owningTeam: null,
      errors: [],
      success: null
    };
    corUtils.info(`[analyseFTestInventoryFile] started FTestInventory file analysis ${fileInfo.relative}`);
    let inventoryFile = this.findInventoryFile(resolve(fileInfo.root, fileInfo.moduleRoot));
    if (!inventoryFile) {
      corUtils.log(`   Ownership file not found:\t${fileInfo.moduleRoot}`);
      result.errors.push(`Ownership file not found:\t${fileInfo.moduleRoot}`);
      result.success = false;
      return result;
    }
    let rootRelativePath = path.join(fileInfo.moduleRoot, inventoryFile.fileName);

    let currentInventoryFileContent;
    if (cachedInventoryFile) {
      if (cachedInventoryFile.cachedFilePath === rootRelativePath) {
        // read the cached file from memory
        currentInventoryFileContent = cachedInventoryFile.content;
      }
    }

    if (!currentInventoryFileContent) {
      // load the Ownership file as in memory is either wrong or absent
      let inventoryFileData = this.readAndVerifyInventoryFile(fileInfo, inventoryFile);
      if (!inventoryFileData.success) {
        corUtils.log(`   Ownership file is wrong:\t${inventoryFileData.errors}`);
        result.errors.push(`Ownership file is wrong:\t${inventoryFileData.errors}`);
        result.errors.push(inventoryFileData.errors);
        result.success = false;
        return result;
      }
      currentInventoryFileContent = inventoryFileData.content;
      if (cachedInventoryFile) {
        cachedInventoryFile.cachedFilePath = rootRelativePath;
        cachedInventoryFile.content = currentInventoryFileContent;
      }
      corUtils.info(`[analyseFTestInventoryFile] succeeded file load ${fileInfo.relative} Success:${inventoryFileData.success}`);
    }

    fileInfo.fTestInventoryInfo = {
      inventoryFile,
      found: false
    };
    let inventoryInfo = this.findTestOwnershipInfo(currentInventoryFileContent, fileInfo.javaClassFQN);
    fileInfo.fTestInventoryInfo.testInfo = inventoryInfo;
    fileInfo.fTestInventoryInfo.found = inventoryInfo.success && inventoryInfo.found;

    corUtils.info(`[analyseFTestInventoryFile] finished FTestInventory file analysis ${fileInfo.relative}`);
    return fileInfo.fTestInventoryInfo;
  }
};


module.exports = fTestInventoryFileUtil;
