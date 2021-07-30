const
    utils = require('../corUtils.js'),
    repositoryOwnershipReport = require('../storage/data/ownershipReportRecord');


const ownershipReportWorker = {

    async run(workerInfo, parameters) {
        utils.log(`ownershipReportWorker:${workerInfo.id}: ${workerInfo.name} Start`);
        let newReport = {
            name: 'OwnershipReport',
            startedTime: Date.now(),
            status: "enqueued",
            workerId: workerInfo.id,
            workerName: workerInfo.name
        };
        await repositoryOwnershipReport.insertRecord(parameters.database, newReport);
        await utils.sleep(10000);
        if (!parameters) {
            throw new Error("No parameters provided!");
        }
        utils.log("ownershipReportWorker:${workerInfo.id}: ${workerInfo.name} End");
    }
}

module.exports = ownershipReportWorker;