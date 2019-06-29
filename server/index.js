const express = require('express');
const MongoClient = require('mongodb').MongoClient;

const app = express();
// const expressMongoDb = require('express-mongo-db');
// const database = require('./api-script.js');
// const db = database.getDb();
const port = 3000;

app.use(express.static(__dirname + '/../client/dist'));

// powerhouse, a true big dawg
let db;
let workflowsDb;
let stepsDb;

MongoClient.connect("mongodb://localhost:27017/", { useNewUrlParser: true }, (err, client) => {
  if (err) throw err;
  db = client.db('workflows');
  console.log('db connected');

  workflowsDb = db.collection('workflows');
  stepsDb = db.collection('steps');
  // set external workflow ID and base32 action values to be unique
  workflowsDb.createIndex({ 'workflowId': 1 }, { 'unique': true });
  workflowsDb.createIndex({ 'portalId': 1 }); // allow lookup later
  stepsDb.createIndex({ 'actionId': 1 }, { 'unique': true });
  stepsDb.createIndex({ 'portalId': 1 }); // allow lookup later
})

// app.use(expressMongoDb('mongodb://localhost:27017/workflows'));

app.get('/actions', (req, res) => {
  stepsDb.find({ workflowCount: { $gt: 1 }}).limit(10).toArray((err, documents) => {
    // console.log(documents);
    res.send(documents);
  });
});

app.get('/inactive', (req, res) => {
  workflowsDb.find({ active: false }).limit(10).toArray((err, documents) => {
    res.send(documents);
  })
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));