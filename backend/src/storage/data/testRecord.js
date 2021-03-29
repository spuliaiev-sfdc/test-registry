const storage = require('../mongoStorage'),
  corUtil = require("../../corUtils");

const testRecord = {
  collectionName: 'tests',

  async setupCollection(database) {
    let collection = database.collection(this.collectionName);
    collection.createIndex( { class: 1, relative: 1 }, { unique: 1 });
    collection.createIndex( { module: 1 }, { unique: 0 });
    collection.createIndex( { "$**": "text" } );

    return collection;
  },

  async insertRecord(database, record) {
    let coll = database.collection(this.collectionName);
    record.lastUpdate = new Date();
    try {
      const inserted = await coll.replaceOne({class: record.class, relative: record.relative}, record, {upsert: true});
      return inserted && inserted.insertedCount === 1 ? inserted.insertedId : null;
    } catch (e) {
      if (e.code === 11000) {
        try {
          const existingButDifferent = await coll.findOne({class: record.class});
          corUtil.warn(`Replaced TestRecord for class ${record.class}:\nexistingPath:${existingButDifferent.relative}\n     newPath:${record.relative}`);
          const inserted = await coll.replaceOne({class: record.class}, record, {upsert: true});
          return inserted && inserted.insertedCount === 1 ? inserted.insertedId : null;
        } catch (e) {
          corUtil.warn(`Failed to upsert TestRecord`, e);
        }
      } else {
        corUtil.warn(`Failed to insert TestRecord`, e);
      }
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

  addStringContains(fieldName, isRegExp, substring, asExpr) {
    if (isRegExp) {
      let criterion = {};
      criterion[fieldName] = {$regex: substring};
      return criterion;
    } else {
      if (asExpr) {
        return {$expr: { $gt: [{ $indexOfCP: [ "$" + fieldName, substring ] }, -1]}}
      }
      return { $gt: [{ $indexOfCP: [ "$" + fieldName, substring ] }, -1]}
    }
  },

  async getRecordsByTeam(database, requestContent) {
    let coll = database.collection(this.collectionName);

    let query = [];

    let criterion = {};
    if (requestContent.filters) {
      let teamName = requestContent.filters.team;
      if (teamName && teamName.trim().length > 0) {
        let queryCriteria = [];
        query.push({$or: queryCriteria});

        criterion["classInfo.owners.name"] = teamName;
        queryCriteria.push(criterion);
        criterion = {};
        criterion["classInfo.ownersPartial.name"] = teamName;
        queryCriteria.push(criterion);
      }

      let className = requestContent.filters.class;
      if (className && className.trim().length > 0) {
        query.push({"class": {$regex: className, $options: 'i'}});
      }

      let methodName = requestContent.filters.method;
      if (methodName && methodName.trim().length > 0) {
        query.push({
          "methodsInfo": {
            "$elemMatch": {
              "name": {$regex: methodName, $options: 'i'}
            }
          }
        });
      }
    }

    let queryParameters = {};

    if (!requestContent.sorting) {
      requestContent.sorting = {class: 1, relative: 1};
    }
    if (requestContent.filter) {
      let filterByTextCriteria = [];
      query.push({ $or: filterByTextCriteria });

      // criterion = {$text: {
      //         $search: requestContent.filter.searchString,
      //         $caseSensitive: false,
      //         $diacriticSensitive: false
      //       }};
      // filterByTextCriteria.push(criterion);

      criterion = this.addStringContains("class", requestContent.filter.isRegExp, requestContent.filter.searchString, true);
      filterByTextCriteria.push(criterion);
      criterion = this.addStringContains("module", requestContent.filter.isRegExp, requestContent.filter.searchString, true);
      filterByTextCriteria.push(criterion);
      criterion = this.addStringContains("relative", requestContent.filter.isRegExp, requestContent.filter.searchString, true);
      filterByTextCriteria.push(criterion);

      criterion = {
        "classInfo.owners": {
          "$elemMatch": {
            "name": { $regex: requestContent.filter.searchString, $options: 'i' }
          }
        }
      };

      criterion = {
        "methodsInfo": {
          "$elemMatch": {
            "name": { $regex: requestContent.filter.searchString, $options: 'i' }
          }
        }
      };
      filterByTextCriteria.push(criterion);
    }
    if (query.length > 0) {
      query = { $and: query };
    } else {
      query = {};
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
