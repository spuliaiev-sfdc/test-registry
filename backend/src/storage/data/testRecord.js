const storage = require('../mongoStorage'),
  corUtil = require("../../corUtils");

const testRecord = {
  collectionName: 'tests',

  async setupCollection(database) {
    let collection = database.collection(this.collectionName);
    collection.createIndex( { class: 1 }, { unique: 1 });
    collection.createIndex( { module: 1 }, { unique: 0 });
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

  async getRecordsByTeam(database, requestContent, teamName) {
    let coll = database.collection(this.collectionName);

    let query;

    let criterion = {};
    if (teamName && teamName.trim().length > 0) {
      let queryCriteria = [];
      query = { $or: queryCriteria };

      criterion["classInfo.owners.name"] = teamName;
      queryCriteria.push(criterion);
      criterion = {};
      criterion["classInfo.ownersPartial.name"] = teamName;
      queryCriteria.push(criterion);
    }

    let queryParameters = {};

    if (!requestContent.sorting) {
      requestContent.sorting = {class: 1, relative: 1};
    }
    if (requestContent.filter) {
      let filterByTextCriteria = [];
      if (query) {
        let oldQuery = query;
        query = { $and: [ oldQuery, {$or: filterByTextCriteria }] };
      } else {
        query = {$or: filterByTextCriteria };
      }

      // criterion = {$text: {
      //         $search: requestContent.filter.searchString,
      //         $caseSensitive: false,
      //         $diacriticSensitive: false
      //       }};
      // filterByTextCriteria.push(criterion);

      criterion = this.addStringContains("class", requestContent.filter.isRegExp, requestContent.filter.searchString);
      filterByTextCriteria.push(criterion);
      criterion = this.addStringContains("module", requestContent.filter.isRegExp, requestContent.filter.searchString);
      filterByTextCriteria.push(criterion);
      criterion = this.addStringContains("relative", requestContent.filter.isRegExp, requestContent.filter.searchString);
      filterByTextCriteria.push(criterion);
      // criterion = this.addStringContains("classInfo.owners.name", requestContent.filter.isRegExp, requestContent.filter.searchString);
      // filterByTextCriteria.push(criterion);
      // criterion = this.addStringContains("methodsInfo.name", requestContent.filter.isRegExp,requestContent.filter.searchString);
      // filterByTextCriteria.push(criterion);
    }

    corUtil.log('[testRecord] Query', JSON.stringify(query, null, 2));

    return await storage.runQuery(coll, query, queryParameters, requestContent.sorting, requestContent.pagination);
  },

  async getTestsDistributionByKind(database) {
    let coll = database.collection(this.collectionName);
    let list = await coll.aggregate([
      {
        $group: {
          _id: "$testKind",
          count: { $sum: 1 }
        }
      }
    ]);
    return await list.toArray();
  },

  async getTestsCount(database) {
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

  async getUniqueTeamNames(database) {
    let coll = database.collection(this.collectionName);
    let listOwners = await coll.distinct("classInfo.owners.name");
    let listOwnersPartial = await coll.distinct("classInfo.ownersPartial.name");
    let completeSet = new Set([...listOwners, ...listOwnersPartial]);
    return Array.from(completeSet);
  },
};

module.exports = testRecord;
