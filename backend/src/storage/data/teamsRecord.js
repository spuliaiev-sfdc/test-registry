const storage = require('../mongoStorage'),
  corUtil = require("../../corUtils");

const testRecord = {
  collectionName: 'teams',

  async setupCollection(database) {
    let collection = database.collection(this.collectionName);
    collection.createIndex( { name: 1 }, { unique: 1 });
    collection.createIndex( { "$**": "text" } );

    return collection;
  },

  async insertRecord(database, record) {
    try {
      let coll = database.collection(this.collectionName);
      const inserted = await coll.replaceOne({class: record.class, relative: record.relative}, record, {upsert: true});
      return inserted && inserted.insertedCount === 1 ? inserted.insertedId : null;
    } catch (e) {
      corUtil.warn(`Failed to insert TestRecord`, e);
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

  addStringContains(fieldName, isRegExp, substring) {
    if (isRegExp) {
      let criterion = {};
      criterion[fieldName] = {$regex: substring};
      return criterion;
    } else {
      return {$expr: { $gt: [{ $indexOfCP: [ "$" + fieldName, substring ] }, -1]}}
    }
  },

  async getTeamsByAliases(database) {
    let coll = database.collection(this.collectionName);
    let list = await coll.aggregate([
      {
        $project: {
          item: 1,
          numberOfAliases: { $cond: { if: { $isArray: "$aliases" }, then: { $size: "$aliases" }, else: "NA"} }
        }
      }
    ] );
    return await list.toArray();
  },

  async getTeamsCount(database) {
    let coll = database.collection(this.collectionName);
    let list = await coll.aggregate([
      {
        $group: {
          _id: null,
          count: { $sum: 1 }
        }
      }
    ]);
    let data = await list.toArray();
    return data[0].count;
  },

};

module.exports = testRecord;
