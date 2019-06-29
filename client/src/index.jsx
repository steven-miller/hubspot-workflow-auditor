import React from 'react';
import ReactDOM from 'react-dom';
import Inactive from './components/inactive'
import Actions from './components/actions'

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.state.inactive = {};
    this.state.actions = {};
  }

  componentDidMount() {
    fetch('http://localhost:3000/inactive')
      .then((response) => {
        return response.json();
      })
      .then((workflows) => {
        this.setState({
          inactive: workflows
        });
      });
    fetch('http://localhost:3000/actions')
      .then((response) => {
        return response.json();
      })
      .then((actions) => {
        this.setState({
          actions: actions
        });
      });
  }

  render () {
    return (
        <div className='container'>
          <div className='row'>
            <div className='col-sm-12'>
              <h1>HubSpot Workflow Auditor</h1>
              <h2>Inactive Workflows</h2>
              <p>Workflows listed here have not been updated in 30 days and have another indication of inactivity (such as disabled or no contacts enrolled recently)</p>
              <Inactive workflows={this.state.inactive} />
              <h2>Active Workflows</h2>
              <p>Below are some indications of duplicate actions or enrollments shared between workflows</p>
              <h3>Duplicate Actions</h3>
              <Actions actions={this.state.actions} />
              <h3>Duplicate enrollments</h3>
              <p>coming soon...</p>
            </div>
          </div>
        </div>
      )
  }
}

ReactDOM.render(<App />, document.getElementById('app'));