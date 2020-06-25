const
  fs = require('fs'),
  micromatch = require('micromatch'),
  readline = require('readline'),
  colors = require('colors');

const corUtils = {
  defaultLogPrefix: "",
  logLevelThreshold: 6,
  logColored: false,
  ERROR: 0,
  WARN: 1,
  IMPORTANT: 3,
  INFO: 6,
  TRACE: 7,
  LOWEST:10,

  warningsOnly() {
    this.logLevelThreshold = corUtils.WARN;
    return this;
  },

  warn(message, entity) {
    corUtils.log(this.WARN, colors.bgYellow.black(message), entity);
  },

  error(message, entity) {
    corUtils.log(this.ERROR, colors.bgRed.white(message), entity);
  },

  impt(message, entity) {
    corUtils.log(this.IMPORTANT, colors.bgCyan.black(message), entity);
  },

  imptWithPrefix(prefix, message) {
    corUtils.logWithPrefix(prefix, this.IMPORTANT, colors.bgCyan.black(message));
  },

  info(message, entity) {
    corUtils.log(this.INFO, message, entity);
  },

  trace(message, entity) {
    corUtils.log(this.TRACE, message, entity);
  },

  clean(message, entity) {
    corUtils.log(5, message, entity);
  },

  log(level, message, entity) {
    corUtils.logWithPrefix(corUtils.defaultLogPrefix, level, message, entity);
  },

  logWithPrefix(logPrefix, level, message, entity) {
    if (!entity) {
      entity = "";
    }
    if (typeof message == "undefined"  || level === "") {
      message = level;
      level = 6;
    }
    if (level > this.logLevelThreshold) {
      return;
    }
    if (level === this.INFO) {
      console.log(logPrefix+"[INFO]\t"+message, entity);
      return;
    }
    if (level === this.IMPORTANT) {
      console.log(logPrefix+"[IMPTNT]\t"+message, entity);
      return;
    }
    if (level === this.ERROR) {
      console.log(logPrefix+"[ERROR]\t"+message, entity);
      return;
    }
    if (level === this.WARN) {
      console.log(logPrefix+"[WARN]\t"+message, entity);
      return;
    }
    if (isNaN(level)) {
      // print out some custom level as text
      console.log(logPrefix+level+"\t"+message, entity);
    } else {
      console.log(logPrefix+"\t"+message, entity);
    }
  },

  progressStart(message) {
    process.stdout.write(corUtils.defaultLogPrefix + "\t"+message+"\n");
  },

  progress(message) {
    corUtils.clearCurrentConsoleLine();
    process.stdout.write(corUtils.defaultLogPrefix + "\t"+message);
  },

  progressEnd(message) {
    this.clearCurrentConsoleLine();
    process.stdout.write(corUtils.defaultLogPrefix + "\t"+message+"\n");
  },

  clearCurrentConsoleLine(){
    if (process.stdout.isTTY) {
      if (process.stdout.clearLine) {
        process.stdout.clearLine();
      } else {
        if (readline.clearLine) {
          readline.clearLine(process.stdout);
        }
      }
      if (process.stdout.cursorTo) {
        process.stdout.cursorTo(0);
      } else {
        if (readline.cursorTo) {
          readline.cursorTo(process.stdout, 0);
        }
      }
    } else {
      process.stdout.write("\n");
    }
  },

  writeJsonFile(filename, content) {
    if (typeof content == 'object') {
      content = JSON.stringify(content, null,2)
    }
    fs.writeFileSync(`${filename}`, content);
  },

  compareObjects( x, y ) {
    if ( x === y ) return true;
    // if both x and y are null or undefined and exactly the same

    if ( ! ( x instanceof Object ) || ! ( y instanceof Object ) ) return false;
    // if they are not strictly equal, they both need to be Objects

    if ( x.constructor !== y.constructor ) return false;
    // they must have the exact same prototype chain, the closest we can do is
    // test there constructor.

    for ( var p in x ) {
      if ( ! x.hasOwnProperty( p ) ) continue;
      // other properties were tested using x.constructor === y.constructor

      if ( ! y.hasOwnProperty( p ) ) return false;
      // allows to compare x[ p ] and y[ p ] when set to undefined

      if ( x[ p ] === y[ p ] ) continue;
      // if they have the same strict value or identity then they are equal

      if ( typeof( x[ p ] ) !== "object" ) return false;
      // Numbers, Strings, Functions, Booleans must be strictly equal

      if ( ! Object.equals( x[ p ],  y[ p ] ) ) return false;
      // Objects and Arrays must be tested recursively
    }

    for ( p in y ) {
      if ( y.hasOwnProperty( p ) && ! x.hasOwnProperty( p ) ) return false;
      // allows x[ p ] to be set to undefined
    }
    return true;
  },

  isPathMoreSpecific(pathToTest, pathCurrent) {
    let pathToTestTamed = pathToTest.replace('**', '=/=').replace('*', '=');
    let pathCurrentTamed = pathCurrent.replace('**', '=/=').replace('*', '=');
    return micromatch.isMatch(pathToTestTamed, pathCurrent) && !micromatch.isMatch(pathCurrentTamed, pathToTest) ;
  },

  writeContent(outFilePath, user, writeContentFunction, onFinish) {
    corUtils.trace(`          dumping them into file ${outFilePath}`);
    try {
      let logger = fs.createWriteStream(outFilePath);
      logger.on('ready', function () {
        if (typeof writeContentFunction === 'function') {
          try {
            writeContentFunction(logger);
          } catch (e) {
            corUtils.trace(`  Failed in writing content function for ${outFilePath}`, e);
          }
        }
        if (typeof writeContentFunction === 'string') {
          logger.write(writeContentFunction);
        }
        if (Array.isArray(writeContentFunction)) {
          writeContentFunction.forEach(line => {
            logger.write(line);
            logger.write("\n");
          });
        }
      }).on('error', function (err) {
        console.error(`Failed to save for user ${user} `, err);
      }).on('finish', function () {
        if (onFinish) {
          onFinish();
        }
        corUtils.info(`         Saving done into the file for user ${user}`);
      });
    } catch (e) {
      console.error(`   Failed to write content into file ${outFilePath}`, e);
    }
  },

  getFileExtension(fileName) {
    return fileName.slice((Math.max(0, fileName.lastIndexOf(".")) || Infinity) + 1);
  },

  getFileNameNoExt(fileName) {
    let ext = this.getFileExtension(fileName);
    let fn = fileName.split("/").pop();
    let name = ext.length === 0 ? fn : fn.substring(0, fn.length - ext.length - 1);
    return name;
  },

  analyseFileLocation(rootFolder, relativeFileName) {
    let parts = relativeFileName.split("/");
    let info = {
        root: rootFolder,
        relative: relativeFileName,
        module: parts[0],
        modulePath: parts[0],
        moduleRoot: parts[0],
        ext: this.getFileExtension(relativeFileName),
        filename: this.getFileNameNoExt(relativeFileName)
    };

    info.testFolder = parts[1] === "test";
    if (info.testFolder) {
      info.moduleSrcPath = parts[0]+"/"+parts[1]+"/"+parts[2]+"/"+parts[3]+"/"+parts[4];
      info.moduleRoot = parts[0]+"/"+parts[1]+"/"+parts[2];

      if (parts[2] === "func") {
        info.testKind = "func";
      } else {
        // check if this is unit test
        if (parts[2] === "unit") {
          // clarify the kind of unit test - generic or strict
          if (parts[5] === "unit") {
            info.testKind = "unit";
          } else {
            if (parts[5] === "strictunit") {
              info.testKind = "strictunit";
            } else {
              info.testKind = "unknown-unit-test";
            }
          }
          // add the kind of unit test
          info.moduleSrcPath = parts[0]+"/"+parts[1]+"/"+parts[2]+"/"+parts[3]+"/"+parts[4]+"/"+parts[5];
        } else {
          info.testKind = "unknown";
        }
      }
    } else {
      info.moduleSrcPath = parts[0]+"/"+parts[1]+"/"+parts[2];
      info.moduleRoot = parts[0];
    }
    // remove the module path and following slash
    info.relativeToModuleSrc = info.relative.substring(info.moduleSrcPath.length+1);
    info.relativeToModuleRoot = info.relative.substring(info.moduleRoot.length+1);

    // calculate java class FQN if it is java
    if (info.ext.toLowerCase() === 'java') {
      info.javaClassFQN = info.relativeToModuleSrc.replace(/\//g,'.').replace(/\.java$/, "");
    }

    // calculate ownership file path
    info.ownershipFilePath = info.moduleRoot + "/java/resources/ownership.yaml";
    return info;
  },

  addOwnersInfo(ownersCollection, teamName, sourceDescription) {
    if (Array.isArray(sourceDescription)) {
      // If array - process one by one
      sourceDescription.forEach( description => this.addOwnersInfo(ownersCollection, teamName, description) );
      return;
    }
    if (typeof teamName === "object") {
      let ownersMap = teamName;
      // If object - process one by one as it is a map of owners
      for (const teamOwner in ownersMap) {
        let descriptions = ownersMap[teamOwner];
        this.addOwnersInfo(ownersCollection, teamOwner, descriptions);
      }
      return;
    }
    // If one - process the addition
    let existingTeam = ownersCollection[teamName];
    if (!existingTeam) {
      ownersCollection[teamName] = [sourceDescription];
    } else {
      ownersCollection[teamName].push(sourceDescription);
    }
  },
};


module.exports = corUtils;
