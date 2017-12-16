// @flow
import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Mousetrap from 'mousetrap';
import Terminal from 'xterm';
import icons from 'file-icons-js';
import $ from 'jquery';
var pty = require('node-pty');



var xterm = new Terminal()
const glob = require('glob');
// Notice it's called statically on the type, not an object
Terminal.loadAddon('fit');

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
    const self = this;
    Mousetrap.bind('down', (e) => {
      self.focusNextElement();
      return false;
    });
    Mousetrap.bind('up', (e) => {
      self.focusPreviousElement();
      return false;
    });
    this.changeActiveTabIndex(0, this.state.areas[0], 1);
    this.changeActiveTabIndex(1, this.state.areas[1], 0);

    $('.file-system-view').css({ height: `${$(window).height() - 180}px` });
    $(window).resize(() => { // On resize
      $('.file-system-view').css({ height: `${$(window).height() - 180}px` });

    });


    var terminalContainer = document.getElementById('terminal')
    var terminalInput = document.getElementById('terminal-input')
    $(terminalInput).keydown(function (e) {
      if (e.keyCode == 13) {
        var txt = terminalInput.value
        term.write(txt + '\r\n');

      }
    })

    xterm.open(terminalContainer);

    setTimeout(() => {

      xterm.fit();
    }, 200);

    var term = pty.spawn(process.platform === 'win32' ? 'cmd.exe' : 'bash', [], {
      name: 'xterm-color',
      cols: 180,
      rows: 80,
      cwd: process.env.PWD,
      env: process.env
    });
    term.on('data', function (data) {
      console.log(data);
      xterm.write(data)
    });

    term.on('key', function (key, ev) {

      var printable = (!ev.altKey && !ev.altGraphKey && !ev.ctrlKey && !ev.metaKey);

      if (ev.keyCode == 13) {
        term.prompt();
      } else if (ev.keyCode == 8) {
        // Do not delete the prompt
        if (term.x > 2) {
          term.write('\b \b');
        }
      } else if (printable) {
        term.write(key);
      }
    });


    term.write('cd c:\\temp\r\n');



  }

  focusNextElement(current) {
    // add all elements we want to include in our selection
    let x = $(document.activeElement);
    x.next().focus();
  }

  focusPreviousElement(current) {
    // add all elements we want to include in our selection
    let x = $(document.activeElement);
    x.prev().focus();
  }

  changeActiveTabIndex(areaIndex, area, newActiveIndex) {
    const newState = this.state;
    newState.areas[areaIndex].activeIndex = newActiveIndex;
    newState.areas[areaIndex].contents.directories = [];
    this.setState(newState);
    const dir = `${newState.areas[areaIndex].locations[newActiveIndex]}`;

    const fs = require('fs');
    const getDirs = function (rootDir, cb) {
      fs.readdir(rootDir, (err, files) => {
        const dirs = ['..'];
        const filenames = [];
        for (let index = 0; index < files.length; ++index) {
          const file = files[index];
          if (file[0] !== '.') {
            const filePath = `${rootDir}/${file}`;
            fs.stat(filePath, function (err, stat) {
              if (err) {
                console.warn(`error getting stats of ${file}`);
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
    const tabs = [];
    for (let index = 0; index < area.locations.length; index++) {
      const location = area.locations[index].split('/').pop();
      tabs.push(
        <li key={index} className="tab" >
          <span onClick={() => this.changeActiveTabIndex(areaIndex, area, index)} className={index === area.activeIndex ? 'tab-active' : null} >
            {location}/
          </span>
        </li>
      );
    }
    return (
      <ul className="tabs">{tabs}</ul>
    );
  }

  renderArea(areaIndex, area) {
    const files = [];
    const filename = 'README.md';

    for (let d = 0; d < area.contents.directories.length; d++) {
      const dir = area.contents.directories[d];
      const className = 'folder';
      files.push(
        <a key={areaIndex + dir} className={'filesystem-item dark-yellow'} href="#">
          <span className={className} /> <span className={'filesystem-item-name'}>{dir}</span>
        </a>
      );
    }
    for (let f = 0; f < area.contents.files.length; f++) {
      const fn = area.contents.files[f];
      const className = icons.getClassWithColor(fn);
      let colorClassName = (className || '').split(' ');
      if (colorClassName.length === 2) {
        colorClassName = colorClassName.pop();
      } else {
        colorClassName = '';
      }
      files.push(
        <a key={areaIndex + fn} className={'filesystem-item ' + colorClassName} href="#">
          <div className="row">
            <div className="col-xs-6">
              <span className={className} /> <span className={'filesystem-item-name'}>{fn}</span>
            </div>
            <div className="col-xs-3">
              <span className={'filesystem-item-name'}>{'123 kb'}</span>
            </div>
            <div className="col-xs-3">
              <span className={'filesystem-item-name'}>{'01.12.2019'}</span>
            </div>
          </div>
        </a>
      );
    }

    const result = <ul className="area">{files}</ul>;
    return result;
  }

  render() {
    return (

      <div className="container-fluid">

        <div className="row">
          <div className="col-sm-6">
            {this.renderTabs(0, this.state.areas[0])}
            <div className="file-system-view">
              {this.renderArea(0, this.state.areas[0])}
            </div>
          </div>
          <div className="col-sm-6">
            {this.renderTabs(1, this.state.areas[1])}
            <div className="file-system-view">
              {this.renderArea(1, this.state.areas[1])}
            </div>
          </div>
        </div>
        <div className="row vbottom">
          <div className="col-sm-6 vbottom">
            Bottom DIV
          </div>
          <div className="col-sm-6 vbottom">
            Bottom DIV
          </div>
        </div>
        <div className="row vbottom">
          <div className="col-sm-12 vbottom">
            <div id="terminal"></div>
            <input type="text" id="terminal-input" />
          </div>
        </div>
      </div>

    );
  }
}

export default Home;
