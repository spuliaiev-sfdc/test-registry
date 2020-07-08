const storage = require('../mongoStorage');

const testRecord = {
  collectionName: 'tests',

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
      const inserted = await coll.replaceOne({class: record.class, relative: record.relative}, record, {upsert: true});
      return inserted && inserted.insertedCount === 1 ? inserted.insertedId : null;
    } catch (e) {
      corUtils.warn(`Failed to insert TestRecord`, e);
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

  async getRecordsByTeam(database, requestContent, teamName) {
    let coll = database.collection(this.collectionName);

    let queryCriteria = [];
    let criterion = {};
    criterion["classInfo.owners."+teamName] = { $exists: true };
    queryCriteria.push(criterion);
    criterion = {};
    criterion["classInfo.ownersPartial."+teamName] = { $exists: true };
    queryCriteria.push(criterion);

    let requestParameters = {};
    let response = {};

    if (requestContent.pagination) {
      storage.applyPagination(requestContent.pagination, requestParameters);
      response.pagination = requestContent.pagination;
    }

    let request = await coll.find({ $or: queryCriteria }, requestParameters)
      .sort({class : 1, relative: 1});
    let result = await request.toArray();
    response.data = result;
    return response;
  },

};

module.exports = testRecord;
