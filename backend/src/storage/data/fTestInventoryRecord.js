'use strict';
const storage = require('../mongoStorage');
const utils = require('../../corUtils');

const fTestInventoryRecord = {
  collectionName: 'fTestInventory',
  testRecords: false,

  async setupCollection() {
    const database = await storage.getDatabase();
    let collection = database.collection(this.collectionName);
    // https://docs.mongodb.com/manual/reference/method/db.collection.createIndex/
    collection.createIndex( { className: 1 }, { unique: 1 });
    collection.createIndex( { scrumTeam: 1 }, { unique: 1 });

    return collection;
  },

  async testRecord(database, kind, description) {
    if (this.testRecords) {
      await this.insertRecord(database, { kind: kind, label: description });
    }
  },

  async insertRecord(database, record) {
    if (!database) return;
    try {
      let coll = database.collection(this.collectionName);
      const inserted = await coll.replaceOne({className: record.className, file: record.file}, record, {upsert: true});
      return inserted && inserted.insertedCount === 1 ? inserted.insertedId : null;
    } catch (e) {
      utils.warn(`Failed to insert fTestInventoryRecord`, e);
      return null;
    }
  },

  async getRecords(database) {
    let coll = database.collection(this.collectionName);
    let list = await coll.find({});
    return await list.toArray();
  },

  async dropAll(database) {
    let coll = database.collection(this.collectionName);
    await coll.drop();
    return true;
  },

  /**
   * Find the fTestInventoryRecord from the database
   * @param {database} database reference to the MongDB dastabase client
   * @param {string} javaClassFQN Fully qualified name of java class
   * @returns
   *  {{
   *    className: string,
   *    scrumTeam: string = 'Team_01',
   *    description: string,
   *    source: stromg,
   *    categoryElements: [string, string]},
   *    module: string,
   *    file: string
   * }}
   */
  async findByClassName(database, javaClassFQN) {
    try {
      // const database = await storage.getDatabase();
      let coll = database.collection(this.collectionName);
      let result = await coll.findOne({className: javaClassFQN});
      return result;
    } catch (e) {
      utils.warn(`Failed to insert fTestInventoryRecord`, e);
      return null;
    }
  },
  async getFTestInventorySize(database) {
    let coll = database.collection(this.collectionName);
    let list = await coll.aggregate( [
      {
        $group: {
          _id: null,
          count: { $sum: 1 }
        }
      }
    ]);
    let data = await list.toArray();
    return data[0].count;
  }
};

module.exports = fTestInventoryRecord;
