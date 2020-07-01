'use strict';
const storage = require('../mongoStorage');
const corUtils = require('../../corUtils');

const fTestInventoryRecord = {
  collectionName: 'fTestInventory',

  async setupCollection() {
    const database = await getDatabase();
    let collection = database.collection(this.collectionName);
    collection.createIndex( { className: 1 }, { unique: 1 });
    collection.createIndex( { scrumTeam: 1 }, { unique: 1 });

    return collection;
  },

  async insertRecord(database, record) {
    try {
      let coll = database.collection(this.collectionName);
      const insertedId = await coll.insertOne(record);
      return insertedId;
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
   *    categoryPath: string,
   *    categoryElements: [string, string]},
   *    module: string,
   *    file: string
   * }}
   */
  async findByClassName(javaClassFQN) {
    let result = {
      className,
        scrumTeam: scrumTeam,
        source,
        file: 'fileInfo.relative',
      module: 'fileInfo.module',
      description: 'description',
      categoryPath: 'categoryInfo.categoryPath',
      categoryElements: ['categoryInfo','categoryElements']
    };
    let coll = database.collection(this.collectionName);
    let list = await coll.findOne({className: javaClassFQN});
    return list;
  }
};

module.exports = fTestInventoryRecord;
