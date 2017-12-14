// @flow
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import SplitPane from 'react-split-pane';
import Mousetrap from 'mousetrap';

import icons from 'file-icons-js'
import $ from 'jquery'


let glob = require('glob');

class Home extends Component {

  state = {
    areas: [
      {
        locations: ['c:/git', 'c:/git/eye-o'],
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
        locations: ['c:/windows', 'c:/windows/de-DE', 'c:/windows', 'c:/windows'],
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
  componentDidMount() {
    const self = this
    Mousetrap.bind('down', function (e) {
      self.focusNextElement()
      return false;
    });
    Mousetrap.bind('up', function (e) {
      self.focusPreviousElement()
      return false;
    });
    this.changeActiveTabIndex(0, this.state.areas[0], 1)
    this.changeActiveTabIndex(1, this.state.areas[1], 0)

    $('.file-system-view').css({ 'height': ($(window).height() - 20) + 'px' });
    $(window).resize(function () { // On resize
      $('.file-system-view').css({ 'height': ($(window).height() - 20) + 'px' });
    });

  }

  focusNextElement(current) {
    //add all elements we want to include in our selection
    var x = $(document.activeElement)
    x.next().focus()
  }

  focusPreviousElement(current) {
    //add all elements we want to include in our selection
    var x = $(document.activeElement)
    x.prev().focus()
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
        let dirs = ['..'];
        let filenames = [];
        for (let index = 0; index < files.length; ++index) {
          let file = files[index];
          if (file[0] !== '.') {
            let filePath = `${rootDir}/${file}`;
            fs.stat(filePath, function (err, stat) {
              if (err) {
                console.warn(`error getting stats of ${file}`)
              } else {
                if (stat.isDirectory()) {
                  dirs.push(this.file);
                } else {
                  filenames.push(this.file);
                }
                if (files.length === (this.index + 1)) {
                  return cb({ directories: dirs.sort(), files: filenames.sort() });
                }
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
      const location = area.locations[index].split('/').pop();
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
      files.push(
        <a key={areaIndex + dir} className={"filesystem-item"} href="#">
          <span className={className} /> <span className={'filesystem-item-name dark-yellow'}>{dir}</span>
        </a>
      );
    }
    for (let f = 0; f < area.contents.files.length; f++) {
      const fn = area.contents.files[f];
      const className = icons.getClassWithColor(fn);
      var colorClassName = (className || '').split(" ")
      if (colorClassName.length === 2) {

        colorClassName = colorClassName.pop()
      } else {
        colorClassName = ''
      }
      files.push(
        <a key={areaIndex + fn} className={"filesystem-item"} href="#">
          <span className={className} /> <span className={'filesystem-item-name ' + colorClassName}>{fn}</span>
        </a>
      );
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
        <div>
          {this.renderTabs(0, this.state.areas[0])}
          <div className="file-system-view">
            {this.renderArea(0, this.state.areas[0])}
          </div>
        </div>
        <div>
          {this.renderTabs(1, this.state.areas[1])}
          <div className="file-system-view">
            {this.renderArea(1, this.state.areas[1])}
          </div>
        </div>
      </SplitPane>

    );
  }
}

export default Home;
