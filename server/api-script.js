require('dotenv').config()
const MongoClient = require('mongodb').MongoClient;
const request = require('request');
const Bottleneck = require('bottleneck');
const base32 = require('base32');

// powerhouse, a true big dawg
let db;
let workflowsDb;
let stepsDb;

const limiter = new Bottleneck({
  maxConcurrent: 1,
  minTime: 100
});

MongoClient.connect("mongodb://localhost:27017/", { useNewUrlParser: true }, (err, client) => {
  if (err) throw err;
  db = client.db('workflows');

  workflowsDb = db.collection('workflows');
  stepsDb = db.collection('steps');
  // set external workflow ID and base32 action values to be unique
  workflowsDb.createIndex({ 'workflowId': 1 }, { 'unique': true });
  workflowsDb.createIndex({ 'portalId': 1 }); // allow lookup later
  stepsDb.createIndex({ 'actionId': 1 }, { 'unique': true });
  stepsDb.createIndex({ 'portalId': 1 }); // allow lookup later
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

  for (let j = 0; j < activeWorkflows.length; j++) {
    let workflow = activeWorkflows[j];
    for (let k = 0; k < workflow.actions.length; k++) {
      let action = workflow.actions[k];
      console.log('evaluating action --- ', action);
      if ((action.type === 'SET_CONTACT_PROPERTY' && action.propertyName !== '') || (action.type === 'LEAD_ASSIGNMENT' && (action.owners.length !== 0 || action.teamId !== null)) || (action.type === 'EMAIL' && action.emailContentId !== 0)) {
        try {
          let result = await evaluateAction(action, workflow.portalId, workflow.id);
          console.log(result);
        } catch (err) {
          throw err;
        }
      }
    }
    // add each segment to the database
    // add each action to the database

  }
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

const evaluateAction = (action, portalId, workflowId) => {
  console.log('workflowId', workflowId)
  return new Promise(async (resolve, reject) => {
    try {
      let actionId;
      if (action.type === 'SET_CONTACT_PROPERTY') {
        actionId = base32.encode(action.type + action.propertyName + action.newValue + portalId);
      } else if (action.type === 'LEAD_ASSIGNMENT') {
        actionId = base32.encode(action.type + action.ownerProperty + JSON.stringify(action.owners) + JSON.stringify(action.teamId) + portalId);
      } else if (action.type === 'EMAIL') {
        actionId = base32.encode(action.type + action.emailContentId + portalId);
      }
      console.log('base32 action id', actionId)
      let result = await upsertAction(action, 'action', actionId, portalId, workflowId);
      resolve(result);
    } catch (err) {
      reject(err);
    }
  });
};

const evaluateSegment = (segment) => {

};

const upsertAction = (action, category, actionId, portalId, workflowId) => {
  return new Promise(async (resolve, reject) => {
    console.log('actionId', actionId);
    stepsDb.findOne({ actionId: actionId }, (err, document) => {
      console.log(document);
      if (err) {
        reject(err);
      }
      if (document === null) {
        // mutating object - would be nice to find alternative
        action.actionId = actionId;
        action.portalId = portalId;
        action.workflowId = [workflowId];
        action.workflowCount = 1;
        action.category = category;
        stepsDb.insert(action, (err, records) => {
          if (err) {
            reject(err);
          } else {
            resolve(records);
          }
        });
      } else {
        document.workflowId.push(workflowId);
        document.workflowCount++;
        stepsDb.updateOne({ _id: document._id }, { $set: document }, (err, records) => {
          if (err) {
            reject(err);
          } else {
            resolve(records);
          }
        });
      }
    })
  });
};

populateDatabase();
