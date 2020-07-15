
db.getCollection("tests").createIndex( { class: 1 }, { unique: 1 });
db.getCollection("tests").createIndex( { module: 1 }, { unique: 0 });
db.getCollection("tests").createIndex( { "$**": "text" } );


db.getCollection("tests").find(
  {
    $text:
      {
        $search: 'Accounts',
        $caseSensitive: false,
        $diacriticSensitive: false
      }
  });

db.getCollection("tests").find(
  {"classInfo.owners.Accounts": {"$exists": true}}
);
db.claims.aggregate(
  {"$limit":1},
  {"$project":{"owners":{"$objectToArray":"classInfo.owners"}}}
);



db.getCollection("tests").aggregate(
  { $match:
      {"classInfo.owners.Accounts": { "$exists": true }}
  },
  {"$project":{"owners":{"$objectToArray":"$classInfo.owners"}}}
);


db.getCollection("tests").find(
  {
    "$or": [
      {
        "classInfo.owners.Accounts": {
          "$exists": true
        }
      },
      {
        "classInfo.ownersPartial.Accounts": {
          "$exists": true
        }
      }
    ]
  }
);
db.getCollection("tests").find({
  "$and": [
    {
      "$or": [
        {
          "classInfo.owners.Accounts": {
            "$exists": true
          }
        },
        {
          "classInfo.ownersPartial.Accounts": {
            "$exists": true
          }
        }
      ]
    },
    {
      "$or": [
        {
          "$expr": {
            "$gt": [
              {
                "$indexOfCP": [
                  "$class",
                  "C"
                ]
              },
              -1
            ]
          }
        },
        {
          "$expr": {
            "$gt": [
              {
                "$indexOfCP": [
                  "$module",
                  "C"
                ]
              },
              -1
            ]
          }
        },
        {
          "$expr": {
            "$gt": [
              {
                "$indexOfCP": [
                  "$relative",
                  "C"
                ]
              },
              -1
            ]
          }
        }
      ]
    }
  ]
});
