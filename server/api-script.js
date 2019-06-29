require('dotenv').config()
const MongoClient = require('mongodb').MongoClient;
const request = require('request');
const Bottleneck = require('bottleneck');

// powerhouse, a true big dawg
let db;
let workflowsDb;
let actionsDb;

const limiter = new Bottleneck({
  maxConcurrent: 1,
  minTime: 100
});

MongoClient.connect("mongodb://localhost:27017/", { useNewUrlParser: true }, (err, client) => {
  if (err) throw err;
  db = client.db('workflows');

  workflowsDb = db.collection('workflows');
  actionsDb = db.collection('actions');
  // set external workflow ID and base32 action values to be unique
  workflowsDb.createIndex({ 'workflowId': 1 }, { 'unique': true });
  actionsDb.createIndex({ 'actionId': 1 }, { 'unique': true });
})

const populateDatabase = async () => {
  const workflows = await getAllWorkflows(process.env.HAPIKEY);
  let allWorkflows = [];
  let activeWorkflows = [];

  for (let i = 0; i < workflows.length; i++) {
    let workflowMeta = workflows[i];
    try {
      let workflowId = workflowMeta.id;
      // this can be optimized
      let workflow = await limiter.schedule(() => getWorkflow(workflowId));
      console.log('got workflow', i);
      let history = await limiter.schedule(() => getWorkflowHistory(workflowId));
      console.log('got history', i);
      let evaluation = await activeEvaluation(workflow, history);

      console.log(`${i} ---`);
      console.log(evaluation);
      allWorkflows.push(evaluation);

      if (evaluation.active === true) {
        activeWorkflows.push(workflow);
      }
    } catch(err) {
      throw err;
    }
  };

  workflowsDb.insertMany(allWorkflows, { upsert: true }, (err, records) => {
    if (err) { throw err; }
  });


};

const getAllWorkflows = (hapikey) => {
  return new Promise((resolve, reject) => {
    request.get({
      url: `https://api.hubapi.com/automation/v3/workflows/?hapikey=${process.env.HAPIKEY}`,
      headers: {
        'Content-Type': 'application/json'
      }
    }, (error, response, body) => {
      if (error) {
        reject(err);
      } else {
        resolve(JSON.parse(body).workflows);
      }
    });
  });
}

// separated to allow for rate limiting
const getWorkflow = (workflowId) => {
  return new Promise((resolve, reject) => {
    request.get({
      url: `https://api.hubapi.com/automation/v3/workflows/${workflowId}?hapikey=${process.env.HAPIKEY}`,
      headers: {
        'Content-Type': 'application/json'
      }
    }, (error, response, body) => {
      if (error) {
        reject(err);
      } else {
        resolve(JSON.parse(body));
      }
    });
  });
};

const getWorkflowHistory = (workflowId) => {
  const currentDate = Math.floor(new Date());
  const thirtyDaysAgo = currentDate - 2592000000;
  return new Promise((resolve, reject) => {
    request.get({
      url: `https://api.hubapi.com/automation/v3/performance/workflow/${workflowId}?hapikey=${process.env.HAPIKEY}&start=${thirtyDaysAgo}&end=${currentDate}&bucket=MONTH`,
      headers: {
        'Content-Type': 'application/json'
      }
    }, (error, response, body) => {
      if (error) {
        reject(err);
      } else {
        resolve(JSON.parse(body));
      }
    });
  });
};

const activeEvaluation = (workflow, history) => {
  return new Promise((resolve, reject) => {
    try {
      const thirtyDaysAgo = Math.floor(new Date()) - 2592000000;;
      let active = true;
      let lastThirty = true;

      if (workflow.updatedAt <= thirtyDaysAgo) {
        lastThirty = false;
      }

      if ((history.length === 0 || workflow.enabled === false) && !(lastThirty)) {
        active = false;
      }

      // define other vars
      resolve({
        workflowId: workflow.id,
        active: active,
        portalId: workflow.portalId,
        name: workflow.name,
        updatedAt: workflow.updatedAt,
        enabled: workflow.enabled,
        lastThirty: lastThirty,
        title: workflow.title
      });
    } catch(err) {
      reject(err);
    }
  })
}

populateDatabase();


// get all workflows
  // iterate through ids
    // call 1 - wf data
    // call 2 - engagement info, label recentEnrollments = false
    // if engagement info null && no updates L30 || enabled == false && no updates L30
      // label "archive: true";
    // else archive: false
  // insert into mongo