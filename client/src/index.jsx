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
            <h1>HubSpot Workflow Auditor</h1>
          </div>
          <div className='row'>
            <h2>Inactive Workflows</h2>
          </div>
          <div className='row'>
            <Inactive workflows={this.state.workflows} />
          </div>
          <div className='row'>
            <h2>Duplicate Actions</h2>
          </div>
          <div className='row'>
            <Actions actions={this.state.actions} />
          </div>
        </div>
      )
  }
}

ReactDOM.render(<App />, document.getElementById('app'));