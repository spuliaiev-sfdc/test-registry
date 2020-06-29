
// https://auth0.com/blog/node-js-and-express-tutorial-building-and-securing-restful-apis/

const {MongoMemoryServer} = require('mongodb-memory-server');
const {MongoClient} = require('mongodb');

let database = null;

const mongoStorage = {
  database: null,

  async startDatabase(withInMemoryDB) {
    let mongoDBURL = "mongodb://localhost:27017/TestRegistry";
    try {
      if (withInMemoryDB) {
        const mongo = new MongoMemoryServer();
        mongoDBURL = await mongo.getConnectionString();
      }
      const connection = await MongoClient.connect(mongoDBURL, {useNewUrlParser: true});
      this.database = connection.db();
      return this.database;
    } catch (e) {
      return null;
    }
  },

  async getDatabase() {
    if (!this.database)
      await this.startDatabase();
    return this.database;
  }
}

module.exports = mongoStorage;
