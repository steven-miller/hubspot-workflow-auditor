import React from 'react';

class Inactive extends React.Component {
  constructor(props) {
    super(props);
  }

  render () {
    const workflows = Array.from(this.props.workflows);
    for (let i = 0; i < workflows.length; i++) {
      let workflow = workflows[i];
      if (workflow.lastThirty === false && workflow.enabled === false) {
        workflow.message = ' is currently disabled';
      } else {
        workflow.message = ' something else';
      }
    }
    return (
      <ul>
        {workflows.map((workflow) => {
          return <li key={workflow._id}>
            <a href={`https://app.hubspot.com/workflows/${workflow.portalId}/flow/${workflow.workflowId}/edit`}>{workflow.name}</a>
            {/*
            updated in last 30 (lastThirty)
            enabled (enabled)
            hasn't had contact run through in last thirty
            */}
            {workflow.message}
          </li>
        })}
      </ul>
    )
  }
}

export default Inactive;