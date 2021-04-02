const
  fs = require('fs'),
  path = require('path'),
  resolve = require('path').resolve,
  yaml = require('yaml'),
  utils = require('../corUtils.js'),
  xml2js = require('xml2js'),
  streamZip = require('node-stream-zip');

const teamDataSnapshot = {
  // Team data snapshot is stored in the JAR file
  // ~/blt/app/main/core/ext/sfdc.gus_gus-data-snapshot/1.1.1+20210310.1656/jars
  // files:
  /// sfdc/gus/data/snapshot/ProductTagInfo.xml
  /// sfdc/gus/data/snapshot/TeamNameHistory.xml

  // Also possible to get mapping Cloud -> Team:
  // sfdc-test/func/cloud-scrumteam-map.json
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
            teamDataSnapshot.teams = [];
            teamDataSnapshot.teamsMap = {};
            await xml2js.parseString(teamDataSnapshot.filePathContents, function (err, result) {
              console.log("XMl Parsed");
              if (result && result.TeamNameHistory && result.TeamNameHistory.Team && Array.isArray(result.TeamNameHistory.Team)) {
                teamDataSnapshot.xmlValid = true;
                for(let i = 0; i<result.TeamNameHistory.Team.length; i++) {
                  let teamRef = result.TeamNameHistory.Team[i];
                  let team = {
                    name: teamRef.$.name,
                    gusID: teamRef.$.gusID,
                    alias: [teamRef.$.name]
                  };
                  teamDataSnapshot.teams.push(team);
                  teamDataSnapshot.teamsMap[team.name] = team;
                  // add aliases to map
                  for(let a = 0; a < teamRef.Alias.length; a++) {
                    let alias = teamRef.Alias[a].$.name;
                    teamDataSnapshot.teamsMap[alias] = team;
                    team.alias.push(alias);
                  }
                }
              }
              teamDataSnapshot.xmlParsed = true;
            });
            return teamDataSnapshot;
          } catch (e) {
            teamDataSnapshot.error = error;
            teamDataSnapshot.loaded = true;
          }
        }
      }
    }
  },

  getTeamInfo(teamName) {
    if (!teamDataSnapshot.teamsMap) {
      return null;
    }
    return teamDataSnapshot.teamsMap[teamName];
  },

  getTeamAliases(teamName) {
    if (!teamName || teamName.trim().length === 0) {
      return [];
    }
    let teamInfo = this.getTeamInfo(teamName);
    if (!teamInfo) {
      return [teamName];
    }
    return teamInfo.alias;
  },
};

module.exports = teamDataSnapshot;
