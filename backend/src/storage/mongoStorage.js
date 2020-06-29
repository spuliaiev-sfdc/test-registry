
// https://auth0.com/blog/node-js-and-express-tutorial-building-and-securing-restful-apis/

const {MongoMemoryServer} = require('mongodb-memory-server');
const {MongoClient} = require('mongodb');

let database = null;

const mongoStorage = {
  database: null,

  startDatabase() {
    const mongo = new MongoMemoryServer();
    const mongoDBURL = mongo.getConnectionString();
    const connection = MongoClient.connect(mongoDBURL, {useNewUrlParser: true});
    database = connection.db();
  },

  getDatabase() {
    if (!database) this.startDatabase();
    return database;
  }
}

module.exports = mongoStorage;
