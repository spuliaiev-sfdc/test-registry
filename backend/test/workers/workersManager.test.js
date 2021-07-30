var
    assert = require('assert'),
    // sleep = require('system-sleep'),
    sleep = (waitTimeInMs) => new Promise(resolve => setTimeout(resolve, waitTimeInMs)),
    utils = require('../../src/corUtils.js')
        // This is just to set logging to warnings level
        // .warningsOnly(),
    ,
    workersManager = require('../../src/workers/workersManager.js')
    ;


// Async Testing utilities
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const { expect } = chai;
chai.use(chaiAsPromised);

describe('workersManager', function() {
    describe('#listWorkers()', function() {
        it('CheckNoWorkers', function () {
            workersManager.cleanWorkers();
            assert.strictEqual(workersManager.listWorkers().length, 0);
        });
        it('WaitOneWorker', function () {
            this.timeout(10000);
            utils.resetLogTime();
            return expect(
                new Promise(async (resolve) => {
                    workersManager.cleanWorkers();
                    workersManager.initWorker("WorkerSingle", async (worker) => {
                        utils.log("WaitOneWorker:Worker Start");
                        await sleep(1000);
                        utils.log("WaitOneWorker:Worker End");
                    });
                    let workers = workersManager.listWorkers();
                    assert.strictEqual(workers.length, 1);
                    utils.log("Awaiting in WaitOneWorker: worker enqueued");
                    while (true) {
                        workers = workersManager.listWorkers();
                        assert.strictEqual(workers.length, 1);
                        if (workers[0].status === 'finished') {
                            utils.log("Awaiting in WaitOneWorker: worker finished");
                            break;
                        }
                        if (workers[0].status === 'started') {
                            utils.log("Awaiting in WaitOneWorker: worker started");
                        }
                        utils.log("Awaiting in WaitOneWorker");
                        await sleep(300);
                    }
                    utils.log("Awaiting in WaitOneWorker is finished");
                    resolve(workersManager);
                })
            ).to.eventually.be.fulfilled
                .then((result) => {
                    utils.log("=========================================\nExpected to be fulfilled:")
                    utils.log(workersManager.statusOfWorkers());
                    assert.strictEqual(workersManager.listWorkers().length, 1, "Should be 1 workers");
                });
        });
    });
    describe('#listActiveWorkers()', function() {
        it('WaitThreeWorkers', function () {
            this.timeout(10000);
            utils.resetLogTime();
            return expect(
                new Promise(async (resolve) => {
                    workersManager.cleanWorkers();
                    utils.log(`WaitThreeWorkers: active: ${workersManager.listActiveWorkers().length}`);
                    utils.log("WaitThreeWorkers:Worker01 Enqueue");
                    workersManager.initWorker("Worker01", async (worker)=>{
                        utils.log("WaitThreeWorkers:Worker01 Start");
                        await sleep(1000);
                        utils.log("WaitThreeWorkers:Worker01 End");
                    });
                    await sleep(200);
                    utils.log(workersManager.statusOfWorkers());
                    assert.strictEqual(workersManager.listWorkers().length, 1, "Should be 1 worker");
                    assert.strictEqual(workersManager.listPlannedOrActiveWorkers().length, 1, "If not 1 - it means the worker run not asynchronously");
                    utils.log(`WaitThreeWorkers: active: ${workersManager.listPlannedOrActiveWorkers().length}`);
                    utils.log("WaitThreeWorkers:Worker02 Enqueue");
                    workersManager.initWorker( "Worker02", async (worker)=>{
                        utils.log("WaitThreeWorkers:Worker02 Start");
                        await sleep(3000);
                        utils.log("WaitThreeWorkers:Worker02 End");
                    });
                    await sleep(200);
                    utils.log(`WaitThreeWorkers: active: ${workersManager.listPlannedOrActiveWorkers().length}`);
                    utils.log("WaitThreeWorkers:Worker03 Enqueue");
                    workersManager.initWorker( "Worker03", async (worker)=>{
                        utils.log("WaitThreeWorkers:Worker03 Start");
                        await sleep(5000);
                        utils.log("WaitThreeWorkers:Worker03 End");
                    });
                    let workers = workersManager.listWorkers();
                    let workersActive = workersManager.listPlannedOrActiveWorkers();
                    utils.log(`WaitThreeWorkers: active: ${workersManager.listPlannedOrActiveWorkers().length}`);
                    assert.strictEqual(workers.length, 3);
                    assert.strictEqual(workersActive.length, 3, "If not 3 - it means the workers run not asynchronously");
                    utils.log("Awaiting in WaitThreeWorkers: worker enqueued");
                    while(true) {
                        utils.log(workersManager.statusOfWorkers());
                        workers = workersManager.listWorkers();
                        workersActive = workersManager.listPlannedOrActiveWorkers();
                        assert.strictEqual(workers.length, 3);
                        utils.log(`Awaiting in WaitThreeWorkers: active: ${workersActive.length}`);
                        if (workers[2].status === 'finished') {
                            utils.log("Awaiting in WaitThreeWorkers: worker03 finished");
                            break;
                        }
                        if (workers[2].status === 'started') {
                            utils.log("Awaiting in WaitThreeWorkers: worker03 started");
                        }
                        utils.log("Awaiting in WaitThreeWorkers");
                        await sleep(300);
                    }
                    utils.log("Awaiting in WaitOneWorker is finished");
                    resolve(workersManager);
                })
            ).to.eventually.be.fulfilled
                .then((result) => {
                    utils.log("=========================================\nExpected to be fulfilled:")
                    utils.log(workersManager.statusOfWorkers());
                    assert.strictEqual(workersManager.listWorkers().length, 3, "Should be 3 workers");
                    assert.strictEqual(workersManager.listPlannedOrActiveWorkers().length, 0, "All should be finished");
                });
        });
    });
});
