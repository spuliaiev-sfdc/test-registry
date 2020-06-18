const
  fs = require('fs'),
  async = require('async'),
  utils = require('./corUtils.js'),
  resolve = require('path').resolve,
  relative = require('path').relative;

const filesIndexer = {

  iterateFilesAsync(path, concurrency, collback) {

    var scan = function(path, concurrency, callback) {
      var list = [];

      var walker = async.queue(function(path, callback) {
        fs.stat(path, function(err, stats) {
          if (err) {
            return callback(err);
          } else {
            if (stats.isDirectory()) {
              fs.readdir(path, function(err, files) {
                if (err) {
                  callback(err);
                } else {
                  for (var i = 0; i < files.length; i++) {
                    walker.push(resolve(path, files[i]));
                  }
                  callback();
                }
              });
            } else {
              list.push(path);
              callback();
            }
          }
        });
      }, concurrency);

      walker.push(path);

      walker.drain = function() {
        callback(list);
      }
    };

  },

  iterateFiles(path, callbackFile, callbackFolder, callbackErr, concurrency) {
    let status = {
      root: resolve(path),
      currentPath: null,
      currentFullPath: null,
      foldersListToProcess: [],
      foldersProcessed: 0,
      filesProcessed: 0
    };
    status.currentPath = ".";
    status.currentFullPath = resolve(status.root, status.currentPath);
    status.foldersListToProcess.push(status.currentPath);

    let scanFolder = function(path, callbackFile, callbackFolder, callbackErr) {
        let stats;
        try {
          stats = fs.statSync(path);
        } catch (ex) {
          if (ex.code === 'ENOENT') {
            return callbackErr(status, "not_found", path);
          } else {
            return callbackErr(status, "other", path, ex);
          }
        }
        if (stats.isDirectory()) {
          if (!callbackFolder || callbackFolder(status, "start")) {
            let files;
            try {
              files = fs.readdirSync(path);
            } catch (ex) {
              callbackErr(status, "read_dir", path, ex);
            }
            for (let i = 0; i < files.length; i++) {
              let foundFilePath = resolve(path, files[i]);
              let statFile;
              try {
                statFile = fs.statSync(foundFilePath);
              } catch (ex) {
                if (ex.code === 'ENOENT') {
                  return callbackErr(status, "not_found", foundFilePath);
                } else {
                  return callbackErr(status, "other", foundFilePath, ex);
                }
              }
              let relativePath = relative(status.root, foundFilePath);
              if (statFile.isDirectory()) {
                status.foldersListToProcess.push(relativePath);
              } else {
                callbackFile(status, relativePath, files[i]);
                status.filesProcessed++;
              }
            }
            status.foldersProcessed++;
            callbackFolder(status, "finish");
          }
        } else {
          let foundFilePath = resolve(path, files[i]);
          callbackFile(status, foundFilePath, files[i]);
        }
      };
    callbackFolder(status, "start_all");
    while(status.foldersListToProcess.length > 0) {
      let currentPath = status.foldersListToProcess.pop();
      status.currentPath = currentPath;
      status.currentFullPath = resolve(status.root, currentPath);
      if (!callbackFolder || callbackFolder(status, "start")) {
        scanFolder(status.currentFullPath, callbackFile, callbackFolder, callbackErr);
      }
    }
    callbackFolder(status, "finish_all");
  },

  indexFiles(param) {
    let outputTotalFilePath = `${param.dataFolder}/indexed`;
    utils.writeContent(outputTotalFilePath, 'indexing', indexingWriter => {
      utils.log(`         Processing user ${user}`);

/*
      const readInterface = readline.createInterface({
        input: fs.createReadStream(`${param.dataFolder}/changes_${user}.list.diffs`),
        console: false
      });
      readInterface.on('line', line => {
      });
      readInterface.on('close', () => {
        utils.trace(`          read finished for user ${user}`);
        loggerUser.end();
        usersToComplete.delete(user);
        if (usersToComplete.size === 0) {
          indexingWriter.end();
          finishReadingAll();
        }
      });
*/
    }, () => {
      utils.trace(`          write finished for total.added`);
    });
  }
};


module.exports = filesIndexer;
