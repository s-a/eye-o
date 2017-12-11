// @flow
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import styles from './Home.css';
import SplitPane from 'react-split-pane';
import Mousetrap from 'mousetrap';

let glob = require('glob');

class Home extends Component {
  state = {
    areas: [
      {
        locations: ['c:/git', 'c:/temp'],
        activeIndex: 1
      },
      {
        locations: ['c:/windows', 'c:/windows', 'c:/windows', 'c:/windows'],
        activeIndex: 2
      }
    ]
  }

  changeActiveTabIndex(areaIndex, area, newActiveIndex) {
    let newState = this.state;
    newState.areas[areaIndex].activeIndex = newActiveIndex;
    this.setState(newState);
    let dir = `${newState.areas[areaIndex].locations[newActiveIndex]}`;

    let fs = require('fs');
    let getDirs = function (rootDir, cb) {
      fs.readdir(rootDir, (err, files) => {
        let dirs = [];
        for (let index = 0; index < files.length; ++index) {
          let file = files[index];
          if (file[0] !== '.') {
            let filePath = `${rootDir}/${file}`;
            fs.stat(filePath, function (err, stat) {
              if (stat.isDirectory()) {
                dirs.push(this.file);
              }
              if (files.length === (this.index + 1)) {
                return cb(dirs);
              }
            }.bind({ index, file }));
          }
        }
      });
    };

    getDirs(dir, (err, files) => {
      debugger;
    });
  }

  renderTabs(areaIndex, area) {
    let tabs = [];
    for (let index = 0; index < area.locations.length; index++) {
      const location = area.locations[index];
      tabs.push(
        <li key={index} className="tab" >
          <span onClick={() => this.changeActiveTabIndex(areaIndex, area, index)} className={index === area.activeIndex ? 'tab-active' : null} >{location}</span>
        </li>
      );
    }
    return (
      <ul className="tabs">{tabs}
      </ul>
    );
  }

  render() {

    return (

      <SplitPane
        split="vertical"
        defaultSize={50}
        allowResize
        defaultSize={parseInt(localStorage.getItem('splitPos'), 10)}
        onChange={size => localStorage.setItem('splitPos', size)}
      >
        <div className="file-system-view">
          {this.renderTabs(0, this.state.areas[0])}
        </div>
        <div className="file-system-view">
          {this.renderTabs(1, this.state.areas[1])}
        </div>
      </SplitPane>

    );
  }
}

export default Home;
