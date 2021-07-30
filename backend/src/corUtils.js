const
  fs = require('fs'),
  micromatch = require('micromatch'),
  readline = require('readline'),
  colors = require('colors');

const utils = {
  defaultLogPrefix: "",
  logLevelThreshold: 6,
  logColored: false,
  ERROR: 0,
  WARN: 1,
  IMPORTANT: 3,
  INFO: 6,
  TRACE: 7,
  LOWEST:10,
  logTime: true,
  startTime: undefined,
  TIME_PADDING: 8,

  warningsOnly() {
    this.logLevelThreshold = utils.WARN;
    return this;
  },

  warn(message, entity) {
    utils.log(this.WARN, colors.bgYellow.black(message), entity);
  },

  error(message, entity) {
    utils.log(this.ERROR, colors.bgRed.white(message), entity);
  },

  impt(message, entity) {
    utils.log(this.IMPORTANT, colors.bgCyan.black(message), entity);
  },

  imptWithPrefix(prefix, message) {
    utils.logWithPrefix(prefix, this.IMPORTANT, colors.bgCyan.black(message));
  },

  info(message, entity) {
    utils.log(this.INFO, message, entity);
  },

  trace(message, entity) {
    utils.log(this.TRACE, message, entity);
  },

  clean(message, entity) {
    utils.log(5, message, entity);
  },

  log(level, message, entity) {
    utils.logWithPrefix(utils.defaultLogPrefix, level, message, entity);
  },

  logWithMessagePrefix(messagePrefix, logPrefix, level, message, entity) {
    utils.logWithPrefix(logPrefix, level, messagePrefix + message, entity);
  },

  logWithPrefix(logPrefix, level, message, entity) {
    if (!entity) {
      entity = "";
    }
    if (typeof message == "undefined" || level === "") {
      message = level || logPrefix;
      logPrefix = "";
      level = 6;
    }
    if (level > this.logLevelThreshold) {
      return;
    }
    let levelText = level ? "["+level+"]" : "";
    if (level === this.INFO) {
      levelText = "[INFO]";
    }
    if (level === this.IMPORTANT) {
      levelText = "[IMPTNT]";
    }
    if (level === this.ERROR) {
      levelText = "[ERROR]\t";
    }
    if (level === this.WARN) {
      levelText = "[WARN]\t";
    }
    let timeText = "";
    if (utils.logTime) {
      if (!utils.startTime) {
        utils.startTime = Date.now();
        timeText = ' '.repeat(utils.TIME_PADDING-1)+"0\t";
      } else {
        let now = (Date.now()-utils.startTime).toString();
        timeText = ' '.repeat(utils.TIME_PADDING-now.length)+now+"\t";
      }
    }
    console.log(`${timeText}${logPrefix}${levelText}\t${message}`, entity);
  },

  resetLogTime() {
    utils.startTime = undefined;
  },

  progressStart(message) {
    process.stdout.write(utils.defaultLogPrefix + "\t"+message+"\n");
  },

  progress(message) {
    utils.clearCurrentConsoleLine();
    process.stdout.write(utils.defaultLogPrefix + "\t"+message);
  },

  progressEnd(message) {
    this.clearCurrentConsoleLine();
    process.stdout.write(utils.defaultLogPrefix + "\t"+message+"\n");
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
    utils.trace(`          dumping them into file ${outFilePath}`);
    try {
      let logger = fs.createWriteStream(outFilePath);
      logger.on('ready', function () {
        if (typeof writeContentFunction === 'function') {
          try {
            writeContentFunction(logger);
          } catch (e) {
            utils.trace(`  Failed in writing content function for ${outFilePath}`, e);
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
        utils.info(`         Saving done into the file for user ${user}`);
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

    info.testFolder = parts[1] === "test" || parts[1] === "func" || parts[1] === "unit";
    let moduleRootOffset = 0;
    let moduleSrcOffset = 0;
    let subPathForJava = 3; // like java/src/subKind  - but sometimes src is missing - test for that
    if (info.testFolder) {
      moduleRootOffset = 1;
      if (parts[1] === "test") {
        // step one level down
        moduleRootOffset++;
      }
      // Valid paths are:
      // module/test/func/java/src/com/company/package/Class.java
      // module/test/unit/java/src/strictunit/com/company/package/Class.java
      // module/test/unit/java/src/unit/com/company/package/Class.java
      if (parts[moduleRootOffset] === "func") {
        info.testKind = "func";
        moduleRootOffset = parts[1] === "test" ? 2 : 1;
      } else {
        // check if this is unit test
        if (parts[moduleRootOffset] === "unit") {
          // clarify the kind of unit test - generic or strict
          // type of unit test + one more time in sources
          moduleSrcOffset++;
          if (! (parts[moduleRootOffset+subPathForJava-1] === "src")) {
            // Looks like SRC is missing - shorten the offset
            subPathForJava--;
          }
          if (parts[moduleRootOffset+subPathForJava] === "unit") {
            info.testKind = "unit";
          } else {
            if (parts[moduleRootOffset+subPathForJava] === "strictunit") {
              info.testKind = "unit-strict";
            } else {
              info.testKind = "unit-unknown";
            }
          }
          // add the kind of unit test
        } else {
          info.testKind = "unknown";
          utils.warn(` Unknown test folder detected ${relativeFileName}`);
        }
      }
    }
    info.moduleSrcPath = parts.slice(0, moduleRootOffset+subPathForJava+moduleSrcOffset).join("/");
    info.moduleRoot = parts.slice(0, moduleRootOffset+1).join("/");

    // remove the module path and following slash
    info.relativeToModuleSrc = info.relative.substring(info.moduleSrcPath.length+1);
    info.relativeToModuleRoot = info.relative.substring(info.moduleRoot.length+1);

    // calculate java class FQN if it is java
    if (info.ext.toLowerCase() === 'java') {
      info.javaClassFQN = info.relativeToModuleSrc.replace(/\//g,'.').replace(/\.java$/, "");
    }

    return info;
  },

  getTagInfo(tagsList, tagName) {
    let index = this.indexOfTag(tagsList, tagName);
    return tagsList[index].desc;
  },
  getTagDesc(tagsList, tagName) {
    let index = this.indexOfTag(tagsList, tagName);
    return tagsList[index].desc;
  },
  indexOfTag(tagsList, tagName){
    for(let i = 0; i < tagsList.length; i++) {
      if (tagsList[i].name === tagName) {
        return i;
      }
    }
    return -1;
  },
  copyTags(sourceTagsList, targetTagsList){
    for(let i = 0; i < sourceTagsList.length; i++) {
      this.addTagInfo(targetTagsList, sourceTagsList[i].name, sourceTagsList[i].desc);
    }
  },
  addTagInfo(tagsList, tagName, sourceDescription) {
    if (typeof sourceDescription === "undefined" && typeof tagsList === "string") {
      // Shift everything one step right - the initial collection is undefined
      sourceDescription = tagName;
      tagName = tagsList;
      tagsList = [];
    }
    if (typeof tagsList === "undefined") {
      tagsList = [];
    }
    if (!Array.isArray(tagsList)) {
      this.error(`Provided tags list is not an array!`, tagsList);
      return;
    }
    if (Array.isArray(tagName)) {
      if (tagName.length > 0) {
        // Two cases
        // 1) there might be multiple tags with the same description,
        // 2) or it's complete new tagsList

        if (typeof tagName[0] === "object" && tagName[0].name && tagName[0].desc) {
          // this is complete tag
          // If array of tags - process tags one by one
          tagName.forEach(tagInfo => this.addTagInfo(tagsList, tagInfo.name, tagInfo.desc));
        } else {
          // this is tag name!
          // If array of tags - process tags one by one
          tagName.forEach(tagName => this.addTagInfo(tagsList, tagName, sourceDescription));
        }
      }
      return tagsList;
    }
    if (Array.isArray(sourceDescription)) {
      // If array - process descriptions one by one
      sourceDescription.forEach( description => this.addTagInfo(tagsList, tagName, description) );
      return tagsList;
    }
    if (typeof tagName === "object") {
      let ownersMap = tagName;
      // If object - process one by one as it is a map of owners
      for (const teamOwner in ownersMap) {
        let descriptions = ownersMap[teamOwner];
        this.addTagInfo(tagsList, teamOwner, descriptions);
      }
      return tagsList;
    }
    if (tagName) {
      // find the index of the tag in tags array
      let index = this.indexOfTag(tagsList, tagName);
      if (index === -1) {
        tagsList.push({
          name: tagName,
          desc: [ sourceDescription ]
        });
      } else {
        let tagInfo = tagsList[index];
        if (!tagInfo.desc.includes(sourceDescription)) {
          tagInfo.desc.push(sourceDescription);
        }
      }
    } else {
      utils.warn(`Attempt to add undefined tag`);
    }
    return tagsList;
  },

  /**
   * '2012-11-04_14:55:45'
   */
  timestamp() {
    return new Date().toISOString().
      replace(/T/, '_').      // replace T with a space
      replace(/\..+/, '')     // delete the dot and everything after
  }
};


module.exports = utils;
