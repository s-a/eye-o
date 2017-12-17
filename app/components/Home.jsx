// @flow
import React, { Component } from 'react';
// import { Link } from 'react-router-dom';
import Mousetrap from 'mousetrap';
import Terminal from 'xterm';
import icons from 'file-icons-js';
import $ from 'jquery';
const path = require('path')
var bytes = require('bytes');
const pty = require('node-pty');
var event2string = require('key-event-to-string')()

const xterm = new Terminal();
// Notice it's called statically on the type, not an object
Terminal.loadAddon('fit');


function formatDate(date) {
  return (date || '').toLocaleString().replace(/,/g, ' ');
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

let showKeyInfoTimeout
let showKeyInfoRepeats = 0
let showKeyInfoHistory
function showKeyInfo(e, description) {
  var keys
  if (typeof e === 'string') {
    keys = e.split(' ');
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (key.length > 1) {
        keys[i] = capitalizeFirstLetter(key)
      }
    }
    keys = keys.join(' ')

  } else {
    keys = event2string(e)
  }
  if (showKeyInfoHistory === keys) {
    showKeyInfoRepeats++;
  } else {
    showKeyInfoRepeats = 0
    showKeyInfoHistory = null
  }
  showKeyInfoHistory = keys
  clearTimeout(showKeyInfoTimeout)
  const nfo = $('#key-press-info')
  const nfo1 = $('#key-press-info-short-cut')
  const nfo2 = $('#key-press-info-description')
  let prefix = ''
  if (showKeyInfoRepeats > 0) {
    prefix = (showKeyInfoRepeats + 1) + ' x '
  }
  nfo.stop(true).fadeIn(0)
  nfo1.text(prefix + keys)
  nfo2.text(description || '')
  showKeyInfoTimeout = setTimeout(function () {
    nfo.fadeOut(1000)
  }, 1400)
}


const fitHeight = function fitHeight(el) {
  let total = $('.terminal-container-header').outerHeight() + 50;
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
    activeAreaIndex: 0,
    areas: [
      {
        locations: ['c:/git', 'c:/git/eye-o'],
        activeLocationIndex: 1,
        contents: {
          directories: [
          ],
          files: [
          ]
        }
      },
      {
        locations: ['c:/windows', 'c:/windows/de-DE', 'c:/windows', 'c:/windows'],
        activeLocationIndex: 1,
        contents: {
          directories: [

          ],
          files: [
          ]
        }
      }
    ]
  }

  location(areaIndex) {
    return this.state.areas[areaIndex].locations[this.state.areas[areaIndex].activeLocationIndex]
  }


  setPath(areaIndex, path) {
    let state = this.state
    state.areas[areaIndex].locations[this.state.areas[areaIndex].activeLocationIndex] = path
    this.setState(state)
    this.changeActiveTabIndex(areaIndex, this.state.areas[areaIndex], this.state.areas[areaIndex].activeLocationIndex)
    return false
  }

  changeDirectory(e) {
    let el = document.activeElement
    const p = path.resolve(e.target.href.replace(/file:\/\/\//, '')).replace(/\\/g, '/')
    var areaIndex = $(el).data('area-index')
    this.setPath(areaIndex, p)
    this.focusNextElement()
    e.preventDefault && e.preventDefault();
    return false
  }

  ignoreClick(e) {
    e.preventDefault && e.preventDefault();
    return true
  }

  componentDidMount() {
    const self = this;

    Mousetrap.bind('shift+s n up', function (e) {
      showKeyInfo('shift+s n up', 'Sort files ascending')
      return false;
    });
    Mousetrap.bind('shift+s n down', function (e) {
      showKeyInfo('shift+s n down', 'Sort files descending')
      return false;
    });

    Mousetrap.bind('down', (e) => {
      showKeyInfo(e)
      self.focusNextElement();
      return false;
    });

    Mousetrap.bind('up', (e) => {
      showKeyInfo(e)
      self.focusPreviousElement();
      return false;
    });

    Mousetrap.bind('space', (e) => {
      showKeyInfo(e)
      self.toggleSelection.bind(self)(e);
      return false;
    });

    Mousetrap.bind('enter', (e) => {
      showKeyInfo(e)
      self.changeDirectory.bind(self)(e);
      return false;
    });

    Mousetrap.bind('backspace', (e) => {
      showKeyInfo(e)
      var areaIndex = self.state.activeAreaIndex
      var locationIndex = self.state.areas[areaIndex].activeLocationIndex
      var p = self.state.areas[areaIndex].locations[locationIndex]
      p = path.join(p, '..')
      self.setPath.bind(self)(areaIndex, p);
      return false;
    });

    Mousetrap.bind(['command+s', 'ctrl+s'], function (e) {
      showKeyInfo(e)
      self.showTerminal(true)
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
        showKeyInfo(e)
        const txt = terminalInput.value;
        term.write(`${txt}\r\n`);
        terminalInput.value = '';
      }
      if (e.keyCode === 27) {
        showKeyInfo(e)
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

  focusNextElement() {
    // add all elements we want to include in our selection
    const x = $(document.activeElement);
    if (!x.hasClass('filesystem-item')) {
      $('.area-' + this.state.activeAreaIndex + ':first').find('.filesystem-item:first').focus()
    } else {
      x.next().focus();
      this.setState({ activeAreaIndex: $(document.activeElement).data('area-index') })
    }
  }

  focusPreviousElement(current) {
    // add all elements we want to include in our selection
    const x = $(document.activeElement);
    if (!x.hasClass('filesystem-item')) {
      $('.area-' + this.state.activeAreaIndex + ':first').find('.filesystem-item:last').focus()
    } else {
      x.prev().focus();
      this.setState({ activeAreaIndex: $(document.activeElement).data('area-index') })
    }
  }

  changeActiveTabIndex(areaIndex, area, newActiveLocationIndex) {
    const newState = this.state;
    newState.activeAreaIndex = areaIndex;
    newState.areas[areaIndex].activeLocationIndex = newActiveLocationIndex;
    newState.areas[areaIndex].contents.directories = [];
    this.setState(newState);
    const dir = `${newState.areas[areaIndex].locations[newActiveLocationIndex]}`;

    const fs = require('fs');
    const getDirs = function (rootDir, cb) {
      fs.readdir(rootDir, (err, files) => {
        const dirs = [];
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
          <span onClick={() => this.changeActiveTabIndex(areaIndex, area, index)} className={index === area.activeLocationIndex ? 'tab-active' : null} >
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
        <a data-area-index={areaIndex} onClick={this.ignoreClick.bind(this)} onDoubleClick={this.changeDirectory.bind(this)} key={areaIndex + '_' + dir.name} className={'filesystem-item folder'} href={dir.fullpath}>
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
        <a data-area-index={areaIndex} onClick={this.ignoreClick.bind(this)} key={areaIndex + file.name} className={`filesystem-item ${colorClassName}`} target="_blank" href={file.fullpath}>
          <div className="row no-gutter">
            <div className="col-xs-7">
              <span className={className + 'filesystem-item-name'}> {file.name}</span>
            </div>
            <div className="col-xs-2 text-right">
              <span className={'filesystem-item-size'}>{bytes(file.size, { unitSeparator: ' ' })}</span>
            </div>
            <div className="col-xs-3">
              <span className={'filesystem-item-date'}>{formatDate(file.mtime)}</span>
            </div>
          </div>
        </a>
      );
    }

    const result = <ul className={"area area-" + areaIndex}>{files}</ul>;
    return result;
  }

  render() {
    return (

      <div className="container-fluid">

        <div className="row no-gutter">
          <div className="col-sm-6">
            {this.renderTabs(0, this.state.areas[0])}
            <div className="location-bar">{this.location(0)}</div>
            <div className="file-system-view">
              {this.renderArea(0, this.state.areas[0])}
            </div>
          </div>
          <div className="col-sm-6">
            {this.renderTabs(1, this.state.areas[1])}
            <div className="location-bar">{this.location(1)}</div>
            <div className="file-system-view">
              {this.renderArea(1, this.state.areas[1])}
            </div>
          </div>
        </div>
        <div className="row no-gutter vbottom">
          <div className="col-sm-6 ">
            <div className="footer-bar">footer</div>
          </div>
          <div className="col-sm-6 ">
            <div className="footer-bar">footer</div>
          </div>
        </div>
        <div className="row no-gutter">
          <div className="col-sm-12 vbottom terminal-container-header">
            <a href="#" onClick={this.toggleTerminal.bind(this)}>Shell</a>
          </div>
        </div>
        <div className="row no-gutter vbottom terminal-container">
          <div className="col-sm-12 vbottom">
            <div id="terminal" />
            <input type="text" id="terminal-input" />
          </div>
        </div>
        <div id="key-press-info" className="center">
          <div id="key-press-info-short-cut"></div>
          <div id="key-press-info-description"></div>
        </div>
      </div>

    );
  }
}

export default Home;
