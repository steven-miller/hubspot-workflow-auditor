import React from 'react';

class ActionUrls extends React.Component {
  constructor(props) {
    super(props);
  }

  render () {
    const workflowIds = Array.from(this.props.workflowIds);
    return (
    <ul>
      {workflowIds.map((workflowId) => {
        return <li key={workflowId}>
          <a href={`https://app.hubspot.com/workflows/${this.props.portalId}/flow/${workflowId}/edit`}>{`https://app.hubspot.com/workflows/${this.props.portalId}/flow/${workflowId}/edit`}</a>
        </li>
      })}
    </ul>
    )
  }
}

export default ActionUrls;