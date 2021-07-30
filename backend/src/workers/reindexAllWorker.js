const
    utils = require('../corUtils.js'),
    repositoryOwnershipReport = require('../storage/data/ownershipReportRecord');


const reindexAllWorker = {

    async run(workerInfo, parameters) {
        utils.log(`reindexAllWorker:${workerInfo.id}: ${workerInfo.name} Start`);
        await utils.sleep(5*60*1000); // to run for 5 minutes
        if (!parameters) {
            throw new Error("No parameters provided!");
        }
        utils.log("reindexAllWorker:${workerInfo.id}: ${workerInfo.name} End");
    }
}

module.exports = reindexAllWorker;