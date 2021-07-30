const
    util = require('util'),
    utils = require('../corUtils.js');

const workersManager = {
    MAX_COUNT: 5,
    workers: [],

    cleanWorkers() {
        utils.log(`[WorkersManager] CleanWorkers \n`+workersManager.statusOfWorkers());
        this.workers = [];
    },

    async initWorker(workerName, functionToRun, parameters) {
        utils.log(`[WorkersManager] Enqueue ${workerName}`);
        let worker = {
            name: workerName,
            promise: null,
            functionToRun: functionToRun,
            parameters: functionToRun,
            started: new Date(),
            status: 'enqueued'
        };
        this.workers.push(worker);
        worker.promise = async (resolve, reject)  => {
                utils.log(`[WorkersManager] Start ${worker.name}`);
                worker.status = 'started';
                try {
                    if (parameters) {
                        await functionToRun(worker, ...parameters);
                    } else {
                        await functionToRun(worker);
                    }
                    utils.log(`[WorkersManager] Finished ${worker.name}`);
                    worker.status = 'finished';
                } catch (e) {
                    utils.log(`[WorkersManager] Failed ${worker.name}: ${e.message}`);
                    worker.status = 'failed';
                    worker.error = e.message;
                }
                worker.finished = new Date();
            };
            // () => utils.log(`[WorkersManager] Resolved ${worker.name}`),
            // (err) => utils.log(`[WorkersManager] Failed ${worker.name}`)
        // );
        worker.promise();
        //     .then(() => utils.log(`[WorkersManager] Resolved ${worker.name}`))
        //     .catch((err) => utils.log(`[WorkersManager] Failed ${worker.name}`));
        utils.log(`[WorkersManager] Enqueued ${worker.name}`);
    },

    listWorkers() {
        return this.workers;
    },

    listActiveWorkers() {
        return this.workers.filter( worker => worker.status === 'started' );
    },

    listPlannedWorkers() {
        return this.workers.filter( worker => worker.status === 'enqueued' );
    },

    listPlannedOrActiveWorkers() {
        return this.workers.filter( worker => worker.status === 'enqueued' || worker.status === 'started' );
    },

    statusOfWorkers() {
        return `Workers ${this.workers.length}:\n`+this.workers.map( worker => `${worker.name}:${worker.status}` ).join("\n");
    }

}

module.exports = workersManager;