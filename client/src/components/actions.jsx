import React from 'react';
import ActionUrls from './actionUrls';

class Actions extends React.Component {
  constructor(props) {
    super(props);
  }

  render () {
    const actions = Array.from(this.props.actions);
    return (
    <ul>
      {actions.map((action) => {
        return <li key={action.actionId}>
          The action type: {action.type} | with name: {action.name} | is used with the same value in: {action.workflowCount} workflows
          <ActionUrls
            workflowIds={action.workflowId}
            portalId={action.portalId}
          />
        </li>
      })}
    </ul>
    )
  }
}

export default Actions;