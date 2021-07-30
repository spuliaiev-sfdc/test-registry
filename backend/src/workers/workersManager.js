const
    utils = require('../corUtils.js');

/**
 * Worker statuses:
 * * enqueued
 * * started
 * * finished
 * * failed
 * * killed
 */
const workersManager = {
    last_worker_id: 0,
    MAX_COUNT: 5,
    workers: [],

    cleanWorkers() {
        utils.log(`[WorkersManager] CleanWorkers \n`+workersManager.statusOfWorkers());
        this.workers = [];
    },

    cleanWorkersFinishedOrFailed() {
        utils.log(`[WorkersManager] cleanWorkersFinishedOrFailed Before Cleanup\n`+workersManager.statusOfWorkers());

        let new_workers = [];
        this.workers
            .filter( worker => worker.status !== 'failed' && worker.status !== 'failed' && worker.status !== 'killed' )
            .forEach(
                worker => new_workers.push(worker)
            );

        this.workers = new_workers;
        utils.log(`[WorkersManager] cleanWorkersFinishedOrFailed After Cleanup:\n`+workersManager.statusOfWorkers());
    },

    cleanWorkersOlderAnHour() {
        utils.log(`[WorkersManager] cleanWorkersOlderAnHour Before Cleanup\n`+workersManager.statusOfWorkers());

        let new_workers = [];
        this.workers
            // Finished more than hour ago
            .filter( worker => !worker.finished  || Date.now() - worker.finished > 60*60*1000)
            .forEach(
                worker => new_workers.push(worker)
            );

        this.workers = new_workers;
        utils.log(`[WorkersManager] cleanWorkersOlderAnHour After Cleanup:\n`+workersManager.statusOfWorkers());
    },

    async initWorker(workerName, runInstance, parameters) {
        utils.log(`[WorkersManager] Enqueue ${workerName}`);
        let next_id = workersManager.last_worker_id++;
        let workerObject = typeof runInstance === "object" ? runInstance : { run: runInstance };
        let functionToRun = workerObject.run;
        let worker = {
            id: next_id,
            name: workerName,
            started: new Date(),
            finished: null,
            error: null,
            status: 'enqueued',
            promise: null,
            workerObject: workerObject,
            functionToRun: functionToRun,
            parameters: parameters,
        };
        this.workers.push(worker);
        worker.promise = async (resolve, reject)  => {
                utils.log(`[WorkersManager] Start ${worker.name}`);
                worker.status = 'started';
                try {
                    if (parameters) {
                        await workerObject.run(worker, parameters);
                    } else {
                        await workerObject.run(worker);
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
        worker.promise();
        utils.log(`[WorkersManager] Enqueued ${worker.name}`);
        return worker;
    },

    cleanupFromInternalInfo(list){
        if (Array.isArray(list)) {
            let finalList = [];
            list.forEach(worker => finalList.push(this.cleanupFromInternalInfo(worker)));
            return finalList;
        } else {
            if (list) {
                let worker = list;
                return {
                    id: worker.id,
                    name: worker.name,
                    started: worker.started,
                    finished: worker.finished,
                    status: worker.status,
                    error: worker.error
                };
            } else {
                return null;
            }
        }
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
    },

    getWorkerById (workerId) {
        let result = this.workers.find( worker => worker.id === workerId);
        return result;
    }

}

module.exports = workersManager;