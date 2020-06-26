const
  fs = require('fs'),
  path = require('path'),
  resolve = require('path').resolve,
  yaml = require('yaml'),
  utils = require('../corUtils.js'),
  micromatch = require('micromatch');

const ownersFileUtil = {
  DEFAULT_OWNERSHIP_FILE_PATH: '/java/resources/ownership.yaml',

  readAndVerifyOwnershipFile: function (rootFolder, relativePath) {
    utils.trace(`[readAndVerifyOwnershipFile] Ownership file:\t${relativePath}`);

    let fullPath = path.join(rootFolder, relativePath);
    let result = {
      content: null,
      errors: [],
      success: null,
      ownershipFilePath: relativePath
    }
    if (!fs.existsSync(fullPath)) {
      utils.error(`     Ownership file not exists ${relativePath}`)
      result.errors.push(`Ownership file not exists: ${relativePath}`);
      result.success = false;
      return result;
    }
    const fileContent = fs.readFileSync(fullPath, 'utf8');
    if (!fileContent || fileContent.trim().length === 0) {
      utils.error(`     Ownership file is empty ${relativePath}`)
      result.errors.push(`Ownership file is empty: ${relativePath}`);
      result.success = false;
      return result;
    }
    let currentOwnersFileContent = yaml.parse(fileContent);
    if (!currentOwnersFileContent.ownership || !Array.isArray(currentOwnersFileContent.ownership) || currentOwnersFileContent.ownership.length === 0) {
      utils.error(`     Ownership file doesn't have any ownership definitions!  ${relativePath}`)
      result.errors.push(`Ownership file doesn't have any ownership definitions:  ${relativePath}`);
      result.success = false;
      return result;
    } else {
      let ownerInfo = currentOwnersFileContent.ownership[0];
      // when this is the first declared team and it doesnt have any path - assume it owns everything
      let owningTeam = ownerInfo.team;
      utils.log(`      Default team: ${owningTeam}`);
      result.content = currentOwnersFileContent;
      result.success = true;
      result.defaultOwningTeam = owningTeam;
    }
    return result;
  },

  getFileOwningTeam(fileInfo, cachedOwnershipFile) {
    let result = {
      owningTeam: null,
      errors: [],
      success: null
    };
    // calculate ownership file path
    let relativePath = "/java/resources/ownership.yaml";
    let rootRelativePath = path.join(fileInfo.moduleRoot, relativePath);

    let currentOwnersFileContent;
    if (cachedOwnershipFile && cachedOwnershipFile.ownershipFilePath === rootRelativePath) {
      // read the cached file from memory
      utils.trace("[getFileOwningTeam] get file from cache");

      currentOwnersFileContent = cachedOwnershipFile.content;
    }

    if (!currentOwnersFileContent) {
      // load the Ownership file as in memory is either wrong or absent
      utils.trace("[getFileOwningTeam] get file from filesystem");
      let loadResult = this.readAndVerifyOwnershipFile(path.resolve(fileInfo.root, fileInfo.moduleRoot), relativePath);
      if (!loadResult.success) {
        utils.log(`   Ownership file load failed:\t${loadResult.errors}`);
        result.errors.push(`Ownership file is wrong:\t${loadResult.errors}`);
        result.errors.push(loadResult.errors);
        result.success = false;
        return result;
      }
      currentOwnersFileContent = loadResult.content;
      if (cachedOwnershipFile) {
        cachedOwnershipFile.cachedFilePath = rootRelativePath;
        cachedOwnershipFile.content = loadResult.content;
      }
    }

    if (!currentOwnersFileContent) {
      utils.error(`       Ownership file is empty ${rootRelativePath}`)
      result.errors.push(`Ownership file is empty ${rootRelativePath}`);
      result.success = false;
      return result;
    }

    let owningTeam = ownersFileUtil.evaluateOwnerFileRules(currentOwnersFileContent, fileInfo.moduleRoot, fileInfo.relativeToModuleRoot);

    if (owningTeam) {
      utils.info(`     ${owningTeam} \t ${fileInfo.relativeToModuleRoot}\t ${fileInfo.relative}`);
    } else {
      utils.warn(`     Owning team not defined for operation \t ${fileInfo.relative}`)
      owningTeam = "UNASSIGNED";
    }
    result.owningTeam = owningTeam;
    result.success = true;
    fileInfo.ownershipFile = result;
    return result;
  },

  evaluateOwnerFileRules(currentOwnersFileContent, currentModuleRoot, fileRelativeToModule) {
    let owningTeam;
    let pathAssociated; // to store the path with the owning team - if some other path with wild-chars are also matching
    // - the most specific wins: https://docs.google.com/document/d/1-_p0MZg92gYiMN_9wbiiUpwbgc_mw7tXHBBNdB-jJTc/edit#heading=h.msnb0wl138zw
    for (let ownerIndex = 0; ownerIndex < currentOwnersFileContent.ownership.length; ownerIndex++) {
      let ownerInfo = currentOwnersFileContent.ownership[ownerIndex];
      if (ownerIndex === 0 && !ownerInfo.paths) {
        // when this is the first declared team and it doesnt have any path - assume it owns everything
        owningTeam = ownerInfo.team;
        utils.trace(`      Assigning default team ${owningTeam}`);
        continue;
      }
      if (!ownerInfo.paths || !Array.isArray(ownerInfo.paths) || ownerInfo.paths.length === 0) {
        utils.warn(`     Ownership for team ${ownerInfo.team} doesn't have any ownership path!  ${fileRelativeToModule}`)
        continue;
      }
      for (let pathIndex = 0; pathIndex < ownerInfo.paths.length; pathIndex++) {
        let path = ownerInfo.paths[pathIndex];
        if (micromatch.isMatch(fileRelativeToModule, [path])) {
          utils.trace(`       Verify if this path is more specific: `)
          utils.trace(`        current: ${pathAssociated}`)
          utils.trace(`        new    : ${path}`)
          if (!pathAssociated || utils.isPathMoreSpecific(path, pathAssociated)) {
            utils.trace(`       Reassigning to matching team ${ownerInfo.team} from ${owningTeam} by path ${path}`);
            owningTeam = ownerInfo.team;
            pathAssociated = path;
          } else {
            utils.trace(`       New path is less specific, not reassigning to new team ${ownerInfo.team} from ${owningTeam}`);
          }
        }
      }
    }
    return owningTeam;
  },

};


module.exports = ownersFileUtil;
