import React, { Component } from 'react';
import DataStreamer, { ServerRespond } from './DataStreamer';
import Graph from './Graph';
import './App.css';

// Defines the shape of an object
// Must have a single property named data, must be an array of 'serverRespond'
interface IState {
  data: ServerRespond[],
  showGraph: boolean,
}

class App extends Component<{}, IState> {
  intervalID?: number;

  constructor(props: {}) {
    super(props);
    this.state = {
      data: [],
      showGraph: false,
    };
  }

  renderGraph() {
    if (this.state.showGraph) {
      return (<Graph data={this.state.data}/>);
    }
  }

  getDataFromServer() {
    if (this.intervalID) {
      clearInterval(this.intervalID); // Clear any existing intervals
    }

    this.intervalID = window.setInterval(() => {
      DataStreamer.getData((serverResponds: ServerRespond[]) => {
        // Aggregate new data with existing data in a Map for efficient access
        // Use stock symbol and timestamp as the key
        const dataMap = new Map(this.state.data.map(item => 
          [`${item.stock}-${item.timestamp.toString()}`, item]));

        serverResponds.forEach((newDataPoint) => {
          const compositeKey = `${newDataPoint.stock}-${newDataPoint.timestamp.toString()}`;
          const existingDataPoint = dataMap.get(compositeKey);
          if (existingDataPoint) {
            // If a duplicate is found, aggregate the 'top_ask.price' and 'top_bid.price' by averaging
            existingDataPoint.top_ask.price = 
              (Number(existingDataPoint.top_ask.price) + Number(newDataPoint.top_ask.price)) / 2;
            existingDataPoint.top_bid.price = 
              (Number(existingDataPoint.top_bid.price) + Number(newDataPoint.top_bid.price)) / 2;
          } else {
            // If not a duplicate, add the new data point to the Map
            dataMap.set(compositeKey, newDataPoint);
          }
        });
        
        // Convert the Map back to an array for the component's state
        this.setState({
          data: Array.from(dataMap.values()),
          showGraph: true,
        });
      });
    }, 100);
  }

  componentWillUnmount() {
    // Clear the interval when the component is unmounted
    if (this.intervalID) {
      clearInterval(this.intervalID);
    }
  }

  render() {
    // The rest of your render method
    return (
      <div className="App">
        <header className="App-header">
          Bank & Merge Co Task 2
        </header>
        <div className="App-content">
          <button className="btn btn-primary Stream-button" onClick={() => {this.getDataFromServer()}}>
            Start Streaming Data
          </button>
          <div className="Graph">
            {this.renderGraph()}
          </div>
        </div>
      </div>
    );
  }
}

export default App;
