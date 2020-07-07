const
  fs = require('fs'),
  shell = require('shelljs'),
  path = require('path'),
  resolve = require('path').resolve,
  utils = require('./corUtils.js'),
  server = require('./server/server.js'),
  projectIndexer = require('./projectIndexer'),
  dateFormat = require('dateformat');

const homedir = require('os').homedir();

let defaultPort = 8072;
const VERSION = '1.0.0';
let defaultCorePath = `${homedir}/blt/app/main/core`;
let defaultDataPath = `./tmp`;

let args = require('minimist')(process.argv.slice(2), {
  alias: {
    h: 'help',
    v: 'verbose',
    c: 'colored-output', // output in color

    i: 'input-file',    // input file
    o: 'output-folder', // data files with changelists and other output
    a: 'app-folder',   // Root folder for the core app
    d: 'data-folder',   // Root folder for the data
    l: 'logs-folder',   // Root folder for the logs

    r: 'rescan',        // Ignore last scan file and do the full scan again

    f: 'from-date',     // From Date for analysis
    t: 'to-date',       // From Date for analysis
    u: 'users',         // Users to analyse
    // s: 'server',        // Run as Server
    p: 'port',          //`Port to run the server on (default is ${defaultPort})`,

    m: 'module',         // verify only the following module
    g: 'google-sheet'    // add three additional columns for google sheet page
  }
});

function printHelp() {
  utils.clean(`  Allowed steps to run:`);
  utils.clean(`   cl         - fetch changelists for users by dates.`);
  utils.clean(`   diffs      - fetch changelists diffs for users by dates. Not using data from previous step.`);
  utils.clean(`                 Analyses the files and filter out non-java, adding the owners files information.`);
  utils.clean(`   report     - calculates the owners for files from ownership.yaml and prints report. Requires data from previous step.`);
  utils.clean(``);
  utils.clean(`     options:`);
  utils.clean(`       -h print help`);
  utils.clean(`       -v verbose execution`);
  utils.clean(`       -c colored output`);
  utils.clean(`       -r ignore last scan file and do the full scan again`);
  utils.clean(`       -g print report with additional columns for google sheet`);
  utils.clean(`       -m <modulePath> print report filtering out all not related to provided module name. Example: core/conversation-impl`);
  utils.clean(`       -i <fileName> input file for execution`);
  utils.clean(`       -a <folderName> folder with Core App sourcecode`);
  utils.clean(`       -d <folderName> folder with data files`);
  utils.clean(`       -o <folderName> output folder for execution. If ends with / will add the current timestamp in format 2020-02-20_07-13-23 If not provided - use data folder`);
  utils.clean(`       -f <date> From date to run analisys in format 2020/02/10`);
  utils.clean(`       -t <date> To date to run analisys in format 2020/04/20`);
  utils.clean(`       -u <userNames> List of Perforace user names, separated with comma`);

  utils.clean("");
  utils.clean(`  Url to Google Sheet https://docs.google.com/spreadsheets/d/1uR0rspkRFk9itod_kDeqPTY4Y0iUD6DpAPm2rZYNddc/edit?usp=sharing`);
  utils.clean("   Rules in the Google sheet for coloring:")
  utils.clean('    Green  : =OR($C1="Done", $A1 ="Leave")');
  utils.clean('        - This item is OK and should be left as is')
  utils.clean('    Yellow : =AND($A1="Transfer",FIND("Confirm", $C1, 1)=1)');
  utils.clean('        - This item has to be confirmed if needs to be transfered')
  utils.clean('    Blue   : =AND($A1 = "Transfer", NOT(isblank($B1)), NOT(isblank($M1)), $B1 = $M1));');
  utils.clean('        - This item is to be transferred and already done, but not signed off');
  utils.clean('    Orange : =AND(($A1 = "Transfer"), NOT(isblank($B1)), $B1 <> $M1));');
  utils.clean('        - This item is to be transferred, but belongs to a wrong team yet');
  utils.clean('    Red    : =AND($A1 <> "---", NOT(ISBLANK($A1)))');
  utils.clean('        - This item has no defined action yet');
}

let prefixColumns = args.g | false; // prefix columns for google sheet
if (prefixColumns) {
  utils.defaultLogPrefix = "\t\t\t";
} else {
  utils.defaultLogPrefix = "";
}

utils.log(`CORE files Tests Ownership checker App ${VERSION}`);
utils.log(`  direct step execution run`);
let coreFolder = args.a || defaultCorePath;
let dataFolder = args.d || defaultDataPath;
let outputFolder = args.o || dataFolder;
let logsFolder = args.l;
let inputFile = args.i;
let rescan = args.r;
let dateFrom = args.f;
let dateTo = args.t;
let port = args.port || defaultPort;
let moduleToRunFor = args.m;
if(args.v) { // Verbose output
  utils.logLevelThreshold = 10;
}
if(args.c) { // Colored Output
  require('colors').enable();
} else {
  require('colors').disable();
}

// TEST VALUES
if (!outputFolder.startsWith("/")) {
  outputFolder = resolve(outputFolder);
}
if (!coreFolder.startsWith("/")) {
  coreFolder = resolve(coreFolder);
}
if (!dataFolder.startsWith("/")) {
  dataFolder = resolve(dataFolder);
}

utils.log(`  core    : ${coreFolder}`);
utils.log(`  data    : ${dataFolder}`);
if (inputFile) {
  utils.log(`  file    : ${inputFile}`);
}

if (outputFolder.endsWith("/")) {
  // Add the current stamp of run
  let date = new Date();
  let dateStr = dateFormat(date, "yyyy-mm-dd_HH-MM-ss");
  outputFolder += dateStr;
  utils.log(`  output  : ${outputFolder}`);
} else {
  utils.log(`  output  : ${outputFolder}`);
}


if (moduleToRunFor) {
  utils.log(`  module  : ${moduleToRunFor}`);
}

if (args.h) {
  printHelp();
  process.exit(1);
}
if (!fs.existsSync(outputFolder)) {
  fs.mkdirSync(outputFolder, { recursive: true });
}

async function runIndex(runInfo) {
  const mongoStorage = await require("./storage/mongoStorage").getDatabase();
  runInfo.database = mongoStorage;

  await projectIndexer.iterateProject(runInfo);
  console.info(`Run finished`, runInfo);
  process.exit(0);
}

async function runFTestInventoryIndex(runInfo) {
  const mongoStorage = await require("./storage/mongoStorage").getDatabase();
  runInfo.database = mongoStorage;

  await projectIndexer.iterateProjectFTestInventory(runInfo);
  console.info(`Run finished`, runInfo);
  process.exit(0);
}

async function runTestMongo(runInfo) {
  const mongoStorage = await require("./storage/mongoStorage").getDatabase();
  runInfo.database = mongoStorage;
  const invRecord = require('./storage/data/fTestInventoryRecord');
  let records = await invRecord.getRecords(runInfo.database);
  console.log('Invs list', records);

  utils.log(`CORE files Test Ownership checker App ${VERSION} is listening now! Send them requests my way http://127.0.0.1:${defaultPort}/** !`);
  server.startServer(runInfo);
}

async function runServer(runInfo) {
  const mongoStorage = await require("./storage/mongoStorage").getDatabase();
  runInfo.database = mongoStorage;

  utils.log(`CORE files Test Ownership checker App ${VERSION} is listening now! Send them requests my way http://127.0.0.1:${defaultPort}/** !`);
  server.startServer(runInfo);
}

if (args._.includes("index")) {
  let runInfo = {
    rootFolder: coreFolder,
    // place to store report files
    reportFolder: outputFolder,
    // handler to react on report created for file
    onReportGenerated: undefined,
    rescan: rescan,
    module: moduleToRunFor
  };
  runIndex(runInfo);
  return;
}

if (args._.includes("fTests")) {
  let runInfo = {
    rootFolder: coreFolder,
    // place to store report files
    reportFolder: outputFolder,
    // handler to react on report created for file
    onReportGenerated: undefined,
    rescan: rescan,
    module: moduleToRunFor
  };
  runFTestInventoryIndex(runInfo);
  return;
}

if (args._.includes("server")) {
  utils.log(`CORE files Test Ownership checker App ${VERSION} is listening now! Send them requests my way http://127.0.0.1:${defaultPort}/** !`);
  runServer({
    coreFolder,
    outputFolder,
    port,
    logsFolder
  });
  return;
}

if (args._.includes("mongoTest")) {
  utils.log(`CORE files Test Ownership checker App ${VERSION} is listening now! Send them requests my way http://127.0.0.1:${defaultPort}/** !`);
  runTestMongo({});
  return;
}

utils.clean("Unknown command supplied.");
printHelp();
process.exit(0);
