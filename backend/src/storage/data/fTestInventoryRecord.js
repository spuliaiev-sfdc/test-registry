const {getDatabase} = require('../mongoStorage').getDatabase();

const collectionName = 'ads';

const testRecord = {
  collectionName: 'fTestInventory',

  insertRecord(record) {
    const database = getDatabase();
    const {insertedId} = database.collection(collectionName).insertOne(record);
    return insertedId;
  },

  getRecords() {
    const database = getDatabase();
    return database.collection(collectionName).find({}).toArray();
  }

};

module.exports = testRecord;
