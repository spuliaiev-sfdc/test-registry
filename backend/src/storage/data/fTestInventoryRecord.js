const {getDatabase} = require('../mongoStorage').getDatabase();

const fTestInventoryRecord = {
  collectionName: 'fTestInventory',

  async getCollection() {
    const database = await getDatabase();
    return database.collection(this.collectionName);
  },

  async insertRecord(database, record) {
    let coll = database.collection(this.collectionName);
    const {insertedId} = await coll.insertOne(record);
    return insertedId;
  },

  async getRecords(database) {
    let coll = database.collection(this.collectionName);
    let list = await coll.find({});
    return list.toArray();
  }

};

module.exports = fTestInventoryRecord;
