// @flow
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import SplitPane from 'react-split-pane';
import Mousetrap from 'mousetrap';

import icons from 'file-icons-js'



let glob = require('glob');

class Home extends Component {
  state = {
    areas: [
      {
        locations: ['c:/git', 'c:/temp'],
        activeIndex: 1,
        contents: {
          directories: [
            'a',

          ],
          files: [
            'b',

          ]
        }
      },
      {
        locations: ['c:/windows', 'c:/windows', 'c:/windows', 'c:/windows'],
        activeIndex: 2,
        contents: {
          directories: [
            'a',

          ],
          files: [
            'b',

          ]
        }
      }
    ]
  }

  changeActiveTabIndex(areaIndex, area, newActiveIndex) {
    let newState = this.state;
    newState.areas[areaIndex].activeIndex = newActiveIndex;
    newState.areas[areaIndex].contents.directories = [];
    this.setState(newState);
    let dir = `${newState.areas[areaIndex].locations[newActiveIndex]}`;

    let fs = require('fs');
    let getDirs = function (rootDir, cb) {
      fs.readdir(rootDir, (err, files) => {
        let dirs = [];
        let filenames = [];
        for (let index = 0; index < files.length; ++index) {
          let file = files[index];
          if (file[0] !== '.') {
            let filePath = `${rootDir}/${file}`;
            fs.stat(filePath, function (err, stat) {
              if (stat.isDirectory()) {
                dirs.push(this.file);
              } else {
                filenames.push(this.file);
              }
              if (files.length === (this.index + 1)) {
                return cb({ directories: dirs, files: filenames });
              }
            }.bind({ index, file }));
          }
        }
      });
    };

    getDirs(dir, (contents) => {
      newState.areas[areaIndex].contents = contents;
      this.setState(newState);
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
      <ul className="tabs">{tabs}</ul>
    );
  }

  renderArea(areaIndex, area) {
    const files = []
    const filename = 'README.md';

    for (let d = 0; d < area.contents.directories.length; d++) {
      const dir = area.contents.directories[d];
      const className = 'folder';
      files.push(<li key={areaIndex + dir} ><span className={className} /> {dir}</li>);
    }
    for (let f = 0; f < area.contents.files.length; f++) {
      const fn = area.contents.files[f];
      const className = icons.getClassWithColor(fn);
      files.push(<li key={areaIndex + fn}><span className={className} /> {fn}</li>);
    }

    const result = <ul className="area">{files}</ul>;
    return result;
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
          <div>
            {this.renderArea(0, this.state.areas[0])}
          </div>
        </div>
        <div className="file-system-view">
          {this.renderTabs(1, this.state.areas[1])}
          <div>
            {this.renderArea(1, this.state.areas[1])}
          </div>
        </div>
      </SplitPane>

    );
  }
}

export default Home;
