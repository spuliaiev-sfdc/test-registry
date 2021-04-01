const storage = require('../mongoStorage'),
  corUtil = require("../../corUtils");

const configRecord = {
  collectionName: 'configuration',

  async setupCollection(database) {
    let collection = database.collection(this.collectionName);
    collection.createIndex( { name: 1 }, { unique: 1 });

    return collection;
  },

  async updateConfig(database, record) {
    try {
      let coll = database.collection(this.collectionName);
      const inserted = await coll.replaceOne({
        name: 'Configuration'
      }, record, {upsert: true});
      return inserted && inserted.insertedCount === 1 ? inserted.insertedId : null;
    } catch (e) {
      corUtil.warn(`Failed to insert Configuration`, e);
      return null;
    }
  },

  async getConfig(database) {
    let coll = database.collection(this.collectionName);
    let configRecord = await coll.findOne({});
    if (!configRecord) {
      configRecord = {};
    }
    configRecord.name = 'Configuration';
    return configRecord;
  },

  async dropAll(database) {
    let coll = database.collection(this.collectionName);
    await coll.drop();
    return true;
  },

};

module.exports = configRecord;
