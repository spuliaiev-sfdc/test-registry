const
  fs = require('fs'),
  readline = require('readline'),
  resolve = require('path').resolve,
  yaml = require('yaml'),
  utils = require('../corUtils.js'),
  micromatch = require('micromatch');

const ownersFileUtil = {

  readAndVerifyOwnershipFile: function (rootFolder, relativePath) {
    let fullPath = resolve(rootFolder, relativePath);
    let result = {
      content: null,
      errors: [],
      success: null
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
      result.owningTeam = owningTeam;
    }
    return result;
  },

  getFileOwningTeam(param, fileInfo) {
    utils.log("");
    utils.log("runOwnersFileCheck step");
    utils.log("");

    let currentOwnersFile = fileInfo.ownershipFilePath;
    let currentModuleRoot;

    // TODO compare with fileInfo.moduleRoot
    currentModuleRoot = currentOwnersFile.replace("java/resources/ownership.yaml", "");
    utils.log("");
    utils.log(`   Ownership file:\t${currentOwnersFile}`);

    // load the Ownership file
    let ownerFileInfo = this.readAndVerifyOwnershipFile(fileInfo.rootFolder, fileInfo.relatedPath);
    if (!ownerFileInfo.success) {
      utils.log(`   Ownership file is wrong:\t${ownerFileInfo.errors}`);
      return false;
    }
    let currentOwnersFileContent = ownerFileInfo.content;

    utils.log(10, "        > " + line);
    let fileRelativeToCore = fileInfo.relative;
    let fileRelativeToModule = fileInfo.relative;
    if (!currentOwnersFileContent) {
      utils.error(`       Ownership file is missing for ${fileRelativeToCore}`)
      return;
    }
    if (fileRelativeToCore.startsWith(currentModuleRoot)) {
      fileRelativeToModule = fileRelativeToCore.substring(currentModuleRoot.length);
    } else {
      utils.error(`     File is not in the current ownership module! Module: ${currentModuleRoot} , file ${fileRelativeToCore}`)
    }

    let owningTeam = ownersFileUtil.evaluateOwnerFileRules(currentOwnersFile, currentOwnersFileContent, currentModuleRoot, fileRelativeToModule);

    if (owningTeam) {
      utils.imptWithPrefix("" , `     ${owningTeam} \t ${fileRelativeToModule} \t ${fileOperation} \t ${changeOwner} ${suffixColumns} \t ${fileRelativeToCore}`);
    } else {
      utils.warn(`     Owning team not defined for operation \t ${fileOperation} \t ${changeOwner} ${suffixColumns} \t ${fileRelativeToCore}`)
      owningTeam = "UNASSIGNED";
    }

    return owningTeam;
  },

  evaluateOwnerFileRules(currentOwnersFile, currentOwnersFileContent, currentModuleRoot, fileRelativeToModule) {
    let owningTeam;
    let pathAssociated; // to store the path with the owning team - if some other path with wildchars are also matching
    // - the most specific wins: https://docs.google.com/document/d/1-_p0MZg92gYiMN_9wbiiUpwbgc_mw7tXHBBNdB-jJTc/edit#heading=h.msnb0wl138zw
    for(let ownerIndex = 0; ownerIndex < currentOwnersFileContent.ownership.length; ownerIndex++) {
        let ownerInfo = currentOwnersFileContent.ownership[ownerIndex];
        if (ownerIndex === 0 && !ownerInfo.paths) {
          // when this is the first declared team and it doesnt have any path - assume it owns everything
          owningTeam = ownerInfo.team;
          utils.trace(`      Assigning default team ${owningTeam}`);
          continue;
        }
        if (!ownerInfo.paths || !Array.isArray(ownerInfo.paths) || ownerInfo.paths.length === 0) {
          utils.warn(`     Ownership for team ${ownerInfo.team} doesn't have any ownership path!  ${currentOwnersFile}`)
          continue;
        }
        for(let pathIndex = 0; pathIndex < ownerInfo.paths.length; pathIndex++) {
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
