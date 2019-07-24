# HubSpot Workflow Auditor
> Quickly see and action outdated workflows, duplicate enrollments, and duplicate actions

# Table of Contents
1. Overview
2. Installation in current setup
3. Steps before beta release

# 1. Introduction

![Image of Workflow Auditor Early Build](https://stevemiller.dev/assets/images/workflow-audit-early-build.png)

Things that are currently hard to do in HubSpot
* See the last time any lead ran through a workflow
* View which workflows have overlapping enrollment criteria (leading to headaches of tracking down example contacts)
* Understand which workflows are using similar actions (gotta love having a lead double-assigned)

Things that this tool does:
* Identifies outdated workflows
* Reveals similar action steps between active workflows
* Shows overlapping enrollment criteria (coming soon)

# 2. Installation

This will change as the product becomes more developed - currently this can only be run with an API key from your portal and is run to local mongodb.

1. `git clone https://github.com/steven-miller/hubspot-workflow-auditor.git`
1. `cd [folder]` + `npm install`
1. Load your [HubSpot API key](https://knowledge.hubspot.com/articles/kcs_article/integrations/how-do-i-get-my-hubspot-api-key) into a `.env` file as the key `HAPIKEY`
1. `node server/api-script.js` will pull the info down into local mongodb client
1. `npm run react-dev` after script completion
1. `npm start`
1. Navigate to [https://localhost.com:3000](https://localhost.com:3000)

# 3. Steps before beta release

* OAuth method to HubSpot portals
* Username logins for securing and persisting your own data in the cloud
* Seamless flow (login -> pull data -> view data)
* More action evaluations
* Enrollment evaluations
