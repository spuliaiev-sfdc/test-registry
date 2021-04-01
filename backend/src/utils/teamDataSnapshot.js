const
  fs = require('fs'),
  path = require('path'),
  resolve = require('path').resolve,
  yaml = require('yaml'),
  utils = require('../corUtils.js'),
  micromatch = require('micromatch'),
  streamZip = require('node-stream-zip');

const teamDataSnapshot = {
  // Team data snapshot is stored in the JAR file
  // ~/blt/app/main/core/ext/sfdc.gus_gus-data-snapshot/1.1.1+20210310.1656/jars
  // files:
  /// sfdc/gus/data/snapshot/ProductTagInfo.xml
  /// sfdc/gus/data/snapshot/TeamNameHistory.xml
  async loadTeamNamesFile(runInfo) {
    teamDataSnapshot.loadedXml = true;

    teamDataSnapshot.folderWithArtefact = resolve(runInfo.rootFolder, "ext/sfdc.gus_gus-data-snapshot");
    if (fs.existsSync(teamDataSnapshot.folderWithArtefact)) {
      let entries = fs.readdirSync(teamDataSnapshot.folderWithArtefact);
      // Need to improve to find the most recent, but for now just take the first
      if (entries.length > 0) {
        teamDataSnapshot.artefactVersion = entries[0];
        teamDataSnapshot.jarFilePath = resolve(teamDataSnapshot.folderWithArtefact, teamDataSnapshot.artefactVersion, "jars/gus-data-snapshot-" + teamDataSnapshot.artefactVersion + ".jar");
        if (fs.existsSync(teamDataSnapshot.jarFilePath)) {
          try {
            const zip = new streamZip.async({file: teamDataSnapshot.jarFilePath});
            const filePathContents = await zip.entryData("sfdc/gus/data/snapshot/TeamNameHistory.xml");
            await zip.close();
            teamDataSnapshot.loadedXml = true;
            teamDataSnapshot.filePathContents = filePathContents.toString("utf8");
            teamDataSnapshot.loaded = true;
            return teamDataSnapshot;
          } catch (e) {
            teamDataSnapshot.error = error;
            teamDataSnapshot.loaded = true;
          }
        }
      }
    }
  }
};

module.exports = teamDataSnapshot;
