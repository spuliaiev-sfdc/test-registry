'use strict';
const storage = require('../mongoStorage');
const corUtils = require('../../corUtils');

const fTestInventoryRecord = {
  collectionName: 'fTestInventory',
  testRecords: false,

  async setupCollection() {
    const database = await getDatabase();
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
      const inserted = await coll.insertOne(record);
      return inserted && inserted.insertedCount === 1 ? inserted.insertedId : null;
    } catch (e) {
      corUtils.warn(`Failed to insert fTestInventoryRecord`, e);
      return null;
    }
  },

  async getRecords(database) {
    let coll = database.collection(this.collectionName);
    let list = await coll.find({});
    return list.toArray();
  },

  async dropAll(database) {
    let coll = database.collection(this.collectionName);
    await coll.drop();
    return true;
  },

  /**
   * Find the fTestInventoryRecord from the database
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
  async findByClassName(javaClassFQN) {
    let coll = database.collection(this.collectionName);
    let result = await coll.findOne({className: javaClassFQN});
    return result;
  }
};

module.exports = fTestInventoryRecord;
