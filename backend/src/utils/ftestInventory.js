const
  fs = require('fs'),
  readline = require('readline'),
  path = require('path'),
  resolve = require('path').resolve,
  relative = require('path').relative,
  xmlParser = require('fast-xml-parser'),
  he = require('he'),
  filesIndexer = require('../filesIndexer'),
  testRecord = require('../storage/data/testRecord'),
  fTestInventoryRecord = require('../storage/data/fTestInventoryRecord'),
  utils = require('../corUtils.js');

const lodash = require('lodash')

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

  readInventoryFileContent(moduleRootFolder, fileName) {
    let fullFilePath = resolve(moduleRootFolder, fileName);
    const fileContent = fs.readFileSync(fullFilePath, 'utf8');
    if (fileContent.includes("<ftests ")) {
      return {fileName: fileName, content: fileContent, success: true};
    }
    return null;
  },

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
        let result = this.readInventoryFileContent(moduleRootFolder, files[i]);
        if (result && result.success) {
          return result;
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
      if (fileInfo.testKind === 'func') {
        utils.error(`   FTestInventory file not found for module ${fileInfo.moduleRoot}`);
        result.errors.push(`FTestInventory file not found for module ${fileInfo.moduleRoot}`);
        result.success = false;
        return result;
      }
      utils.trace(`   FTestInventory file not found for non-func test module ${fileInfo.moduleRoot}`);
      result.success = true;
      return result;
    }
    const fileContent = inventoryFile.content;
    if (!fileContent || fileContent.trim().length === 0) {
      utils.error(`     FTestInventory file is empty for module ${inventoryFile.moduleRoot}`)
      result.errors.push(`FTestInventory file is empty for module ${inventoryFile.moduleRoot}`);
      result.success = false;
      return result;
    }
    result.filename = inventoryFile.fileName;
    if (!xmlParser.validate(fileContent)) { //optional (it'll return an object in case it's not valid)
      utils.error(`     FTestInventory file is wrong ${inventoryFile.fileName}`)
      result.errors.push(`FTestInventory file is wrong: ${inventoryFile.fileName}`);
      result.success = false;
      return result;
    }
    let currentOwnersFileContent = xmlParser.parse(fileContent, options);
    if (!currentOwnersFileContent.ftests) {
      utils.error(`     FTestInventory file doesn't have any ftest inventory definitions!  ${inventoryFile.fileName}`)
      result.errors.push(`FTestInventory file doesn't have any ftest inventory definitions:  ${inventoryFile.fileName}`);
      result.success = false;
      return result;
    } else {
      result.content = currentOwnersFileContent;
      result.success = true;
    }
    return result;
  },

  /**
   * This function is parsing the inventory and providing the test class information
   * @param {Object} inventoryInfo object with inventory filename, content and parsed xml data
   * @param {string} testClassName Name of the class to find or callback to process the matching class
   * @returns
   * {
   *    success: boolean,
   *    errors: [ 'Error 1 information' ],
   *    found: boolean,
   *    owners: { 'scrumTeam1': [ 'FTestInventory category scrumteam' ]},
   *    categoryElements: ['category1', 'SubCategory2']
   *}
   */
  async findTestOwnershipInfo(inventoryInfo, testClassName) {
    let result = {
      owners: {},
      categoryElements: [],
      errors: [],
      found: false,
      success: false
    }
    if (!inventoryInfo || !inventoryInfo.content || !inventoryInfo.content.ftests) {
      utils.error(`     FTestInventory content is wrong`)
      result.errors.push(`FTestInventory content is wrong:`);
      result.success = false;
      return result;
    }

    function currentCategoryInfo(category, parentCategoryInfo) {
      let info = lodash.cloneDeep(parentCategoryInfo);
      if (!info.categoryElements) info.categoryElements = [];
      if (!info.scrumTeam) info.scrumTeam = undefined;

      info.categoryElements.push(category.attr.name);

      // only if it was not marked as owned by some other team in more precise level - on the test or underlaying category
      if (category.attr.scrumteam) {
        info.scrumTeam = category.attr.scrumteam;
      }
      return info;
    }

    async function findTestInCategory(category, parentCategoryInfo) {
      if (Array.isArray(category)) {
        for (let i = 0; i < category.length; i++) {
          let found = await findTestInCategory(category[i], parentCategoryInfo);
          if (found) {
            result.found = true;
            return true;
          }
        }
        return false;
      }
      async function checkClassMatching(test, categoryInfo) {
        if (test.attr && test.attr.class) {
          let matched = false;
          let description = test.attr.scrumteam ? 'FTestInventory test scrumteam' : 'FTestInventory category scrumteam';
          let scrumTeamSource = test.attr.scrumteam ? 'test' : 'category';
          let scrumTeam = test.attr.scrumteam ? test.attr.scrumteam : categoryInfo.scrumTeam;

          if (typeof testClassName === "string") {
            matched = testClassName === test.attr.class;
          }
          if (typeof testClassName === "function") {
            // Parameters:
            // 1) Name of the class
            // 2) ScrumTeam from the Test element
            // 3) ScrumTeam from the categories tree
            if (testClassName.constructor.name === 'AsyncFunction') {
              matched = await testClassName(test.attr.class, categoryInfo, scrumTeam, scrumTeamSource, description);
            } else {
              matched = testClassName(test.attr.class, categoryInfo, scrumTeam, scrumTeamSource, description);
            }
          }
          if (matched) {
            result.categoryElements = categoryInfo.categoryElements;
            utils.addTagInfo(result.owners, scrumTeam, description);
            return true;
          }
        }
        return false;
      }
      let categoryInfo = currentCategoryInfo(category, parentCategoryInfo);

      if (category.test) {
        // iterate through tests to find the one we need
        if (Array.isArray(category.test)) {
          for (let i = 0; i < category.test.length; i++) {
            if (await checkClassMatching(category.test[i], categoryInfo)) {
              return true;
            }
          }
        } else {
          if (await checkClassMatching(category.test, categoryInfo)) {
            return true;
          }
        }
      }

      // search in sub categories
      if (category.category) {
        return await findTestInCategory(category.category, categoryInfo);
      }
      return false;
    }

    result.found = await findTestInCategory(inventoryInfo.content.ftests, {});
    // not failed, so always success
    result.success = true;
    return result;
  },

  async getTestOwningTeam(fileInfo, cachedInventoryFile) {
    let result = {
      owningTeam: null,
      errors: [],
      success: null
    };
    utils.trace(`[analyseFTestInventoryFile] started FTestInventory file analysis ${fileInfo.relative}`);
    let inventoryFile = this.findInventoryFile(resolve(fileInfo.root, fileInfo.moduleRoot));
    if (!inventoryFile) {
      if (fileInfo.testKind === 'func') {
        utils.error(`   FTestInventory file not found for module ${fileInfo.moduleRoot}`);
        result.errors.push(`FTestInventory file not found for module ${fileInfo.moduleRoot}`);
        result.success = false;
        return result;
      }
      utils.trace(`   FTestInventory file not found for non-func test module ${fileInfo.moduleRoot}`);
      result.success = true;
      return result;
    }
    let rootRelativePath = path.join(fileInfo.moduleRoot, inventoryFile.fileName);

    let currentInventoryFileContent;
    let currentInventoryFileAbsent = false;
    if (cachedInventoryFile && cachedInventoryFile.cachedFilePath === rootRelativePath) {
      // read the cached file from memory
      currentInventoryFileContent = cachedInventoryFile.content;
      currentInventoryFileAbsent = cachedInventoryFile.absent;
    }

    if (!currentInventoryFileContent) {
      // load the Ownership file as in memory is either wrong or absent
      let inventoryFileData = this.readAndVerifyInventoryFile(fileInfo, inventoryFile);
      if (!inventoryFileData.success) {
        utils.warn(`   FTestInventory file is wrong:\t${inventoryFileData.errors}`);
        result.errors.push(`FTestInventory file is wrong:\t${inventoryFileData.errors}`);
        result.errors.push(inventoryFileData.errors);
        result.success = false;
        return result;
      }
      currentInventoryFileContent = inventoryFileData.content;
      if (cachedInventoryFile) {
        cachedInventoryFile.cachedFilePath = rootRelativePath;
        cachedInventoryFile.content = currentInventoryFileContent;
        cachedInventoryFile.absent = currentInventoryFileAbsent;
      }
      utils.trace(`[analyseFTestInventoryFile] succeeded file load ${fileInfo.relative} Success:${inventoryFileData.success}`);
    }

    fileInfo.fTestInventoryInfo = {
      inventoryFile,
      found: false
    };
    let inventoryInfo = await this.findTestOwnershipInfo(cachedInventoryFile, fileInfo.javaClassFQN);
    fileInfo.fTestInventoryInfo.testInfo = inventoryInfo;
    fileInfo.fTestInventoryInfo.found = inventoryInfo.success && inventoryInfo.found;

    utils.trace(`[analyseFTestInventoryFile] finished FTestInventory file analysis ${fileInfo.relative}`);
    return fileInfo.fTestInventoryInfo;
  },

  async enumerateAllTests(runInfo) {
    utils.trace(` FTestInventory complete evaluation start`);
    await require('../storage/data/fTestInventoryRecord').testRecord(runInfo.database, 'mongoTest', ' Test from mongoTest 004');

    this.callbackOnFile = async (status, relativePath, fileName) => {
      utils.trace(` File ${status.filesProcessed} ${fileName} in ${relativePath}`);
      await require('../storage/data/fTestInventoryRecord').testRecord(runInfo.database, 'mongoTest', ' Test from mongoTest 005');
      await require('../storage/data/fTestInventoryRecord').testRecord(runInfo.database, 'mongoTest', ' Test from mongoTest 005+');

      let fileInfo = utils.analyseFileLocation(runInfo.rootFolder, relativePath);
      if (fileInfo.ext.toLocaleString() === 'xml' && fileInfo.filename.toLocaleString() !== 'pom') {
        utils.info(` File ${status.filesProcessed+1} ${relativePath} is potentially an inventory`);

        let processed = await this.enumeratingInventoryProcessor(runInfo, fileInfo);
        if (runInfo.callbackOnFile) {
          await runInfo.callbackOnFile(runInfo, fileInfo, processed);
        }
        status.filesProcessed++;
      } else {
        utils.trace(` File ${status.filesProcessed} ${relativePath} is skipped as not Test`);
      }
    };

    this.callbackOnFolder = (status, operation) => {
      if (operation === 'start') {
        // processing of the root folder - always true
        if (status.currentPath === '.') { return true; }

        // verify that this folder has not yet been processed
        let needsToBeProcessed = true;

        let pathParts = status.currentPath.split('/');
        try {
          // If module specified - process only this module
          if (needsToBeProcessed && runInfo.module && currentPath[0] !== runInfo.module) {
            needsToBeProcessed = false;
            return needsToBeProcessed;
          }
          // if first level - process all
          if (needsToBeProcessed && pathParts.length < 2) {
            needsToBeProcessed = true;
            return needsToBeProcessed;
          }
          // if second level - only process the following patters:
          // module/func
          // module/test/func
          if (needsToBeProcessed && (
              pathParts[1] === 'func' ||
              pathParts.length === 2  && pathParts[1] === 'test' ||
              pathParts.length > 2  && pathParts[1] === 'test' && pathParts[2] === 'func'
          )) {
            needsToBeProcessed = true;
            return needsToBeProcessed;
          }
          needsToBeProcessed = false;
          return needsToBeProcessed;
        } finally {
          if (needsToBeProcessed) {
            utils.info(`Folder processing ${status.foldersProcessed} / ${status.foldersListToProcess.length} : ${status.currentPath}`);
          } else {
            utils.trace(`Folder skipped    ${status.foldersProcessed} / ${status.foldersListToProcess.length} : ${status.currentPath}`);
          }
        }
      }
    };

    this.callbackOnError = (status, errorCode, path, ex) => {
      console.error(`Error ${errorCode} for ${path}`, ex);
      runInfo.errors.push(`Error ${errorCode} for ${path}`);
    };

    await filesIndexer.iterateFiles(runInfo.rootFolder, this.callbackOnFile, this.callbackOnFolder, this.callbackOnError, 1);

    utils.trace(` FTestInventory complete evaluation done`);
    runInfo.success = true;
    return runInfo;
  },

  async enumeratingInventoryProcessor(runInfo, fileInfo) {
    let result = {
      content: null,
      errors: [],
      success: null
    }
    try {
      async function onClassInInventory(className, categoryInfo, scrumTeam, source, description) {
        // classesFound.push({className, scrumTeam, source, categoryInfo });
        utils.trace(`  test class found in inventory ${className}`);
        await require('../storage/data/fTestInventoryRecord').testRecord(runInfo.database, 'mongoTest', ' Test from mongoTest 010');
        if (runInfo.onTestFound) {
          runInfo.onTestFound(runInfo, fileInfo, className, categoryInfo, scrumTeam, source);
        }
        if (runInfo.database) {
          if (!scrumTeam) {
            utils.warn(` scrumTeam is undefined for class ${className} in ${fileInfo.relative}`);
          }
          await fTestInventoryRecord.insertRecord(runInfo.database, {
            className,
            scrumTeam,
            source,
            file: fileInfo.relative,
            module: fileInfo.module,
            description: description,
            categoryElements: categoryInfo.categoryElements
          })
        }
        return false;
      }
      let modulePath = path.resolve(fileInfo.root, fileInfo.moduleRoot);
      let inventoryFile = this.readInventoryFileContent(path.resolve(fileInfo.root, fileInfo.moduleRoot), fileInfo.relativeToModuleRoot);
      if (!inventoryFile || !inventoryFile.success) {
        result.success = false;
        result.errors.push(` Failed to read inventory file ${fileInfo.relative}`)
        return result;
      }
      let inventoryInfo = this.readAndVerifyInventoryFile(fileInfo, inventoryFile);
      if (!inventoryInfo.success) {
        result.success = false;
        result.errors.push(` Failed to parse inventory file ${fileInfo.relative}`)
        result.errors.push(inventoryInfo.errors);
        return result;
      }

      return await this.findTestOwnershipInfo(inventoryInfo, onClassInInventory);
    }catch (e) {
      utils.error(`Failed in processing the potential inventory file ${fileInfo.relative}`, e);
      return {
        errors: [ `Failed in processing the potential inventory file ${fileInfo.relative}` ],
        success: false
      }
    }
  }
};


module.exports = fTestInventoryFileUtil;
