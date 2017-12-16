// @flow
import React, { Component } from 'react';
// import { Link } from 'react-router-dom';
import Mousetrap from 'mousetrap';
import Terminal from 'xterm';
import icons from 'file-icons-js';
import $ from 'jquery';
var bytes = require('bytes');
const pty = require('node-pty');

const xterm = new Terminal();
// Notice it's called statically on the type, not an object
Terminal.loadAddon('fit');


function formatDate(date) {
  if (!date) return ''
  var hours = date.getHours();
  var minutes = date.getMinutes();
  var ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  minutes = minutes < 10 ? '0' + minutes : minutes;
  var strTime = hours + ':' + minutes + ' ' + ampm;
  return date.toLocaleString();
}


const fitHeight = function fitHeight(el) {
  let total = $('.terminal-container-header').outerHeight() + 40;
  if ($('.terminal-container:visible').length !== 0) {
    total += $('.terminal-container:visible').outerHeight() + 80;
  }

  $(el).parent().children().not(el)
    .each(function () {
      total += $(this).outerHeight();
    });
  let newHeight = $(window).height() - total;
  $(el).height(newHeight)
}

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

    $(window).resize(() => { // On resize
      $('.file-system-view').each(function () {
        fitHeight(this)
      })
    });


    const terminalContainer = document.getElementById('terminal');
    const terminalInput = document.getElementById('terminal-input');

    $(terminalInput).keydown((e) => {
      if (e.keyCode === 13) {
        const txt = terminalInput.value;
        term.write(`${txt}\r\n`);
        terminalInput.value = '';
      }
      if (e.keyCode === 27) {
        self.showTerminal(false)
      }
    });
    $(terminalInput).blur((e) => {
      self.showTerminal(false)
    });

    xterm.open(terminalContainer);


    const term = pty.spawn(process.platform === 'win32' ? 'cmd.exe' : 'bash', [], {
      name: 'xterm-color',
      cols: 180,
      rows: 80,
      cwd: process.env.PWD,
      env: process.env
    });
    term.on('data', (data) => {
      console.log(data);
      xterm.write(data);
    });

    term.on('key', (key, ev) => {
      const printable = (!ev.altKey && !ev.altGraphKey && !ev.ctrlKey && !ev.metaKey);

      if (ev.keyCode === 13) {
        term.prompt();
      } else if (ev.keyCode === 8) {
        // Do not delete the prompt
        if (term.x > 2) {
          term.write('\b \b');
        }
      } else if (printable) {
        term.write(key);
      }
    });

    term.write('cd c:\\temp\r\n');

    setTimeout(function () {
      $('.file-system-view').each(function () {
        fitHeight(this)
      })
    }, 100)

  }

  toggleTerminal() {
    this.showTerminal(!$('.terminal-container').is(":visible"))
  }

  showTerminal(show) {
    const c = $('.terminal-container')
    const done = function () {
      $('.file-system-view').each(function () {
        fitHeight(this)
        if (c.is(":visible")) {
          $('#terminal-input').focus()
          xterm.fit()
        }
      })
    }
    if (show) {
      c.fadeIn(0, done);
    } else {
      c.fadeOut(0, done);
    }
  }

  focusNextElement(current) {
    // add all elements we want to include in our selection
    const x = $(document.activeElement);
    x.next().focus();
  }

  focusPreviousElement(current) {
    // add all elements we want to include in our selection
    const x = $(document.activeElement);
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

                stat.name = this.file
                stat.fullpath = filePath
                if (stat.isDirectory()) {
                  dirs.push(stat);
                } else {
                  filenames.push(stat);
                }
                if (files.length === (this.index + 1)) {
                  return cb({ directories: dirs, files: filenames });
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
      const className = 'folder-icon';
      files.push(
        <a key={areaIndex + dir.name} className={'filesystem-item folder'} href="#">
          <span className={className} /> <span className={'filesystem-item-name'}>{dir.name}</span>
        </a>
      );
    }
    for (let f = 0; f < area.contents.files.length; f++) {
      const file = area.contents.files[f];
      const className = icons.getClassWithColor(file.name);
      let colorClassName = (className || '').split(' ');
      if (colorClassName.length === 2) {
        colorClassName = colorClassName.pop();
      } else {
        colorClassName = '';
      }
      files.push(
        <a key={areaIndex + file.name} className={`filesystem-item ${colorClassName}`} href="#">
          <div className="row">
            <div className="col-xs-7">
              <span className={className} /> <span className={'filesystem-item-name'}>{file.name}</span>
            </div>
            <div className="col-xs-2 text-right">
              <span className={'filesystem-item-name'}>{bytes(file.size, { unitSeparator: ' ' })}</span>
            </div>
            <div className="col-xs-3">
              <span className={'filesystem-item-name'}>{formatDate(file.mtime)}</span>
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
          <div className="col-sm-6 ">
            Bottom DIV
          </div>
          <div className="col-sm-6 ">
            Bottom DIV
          </div>
        </div>
        <div className="row">
          <div className="col-sm-12 vbottom terminal-container-header">
            <a href="#" onClick={this.toggleTerminal.bind(this)}>Shell</a>
          </div>
        </div>
        <div className="row vbottom terminal-container">
          <div className="col-sm-12 vbottom">
            <div id="terminal" />
            <input type="text" id="terminal-input" />
          </div>
        </div>
      </div>

    );
  }
}

export default Home;
