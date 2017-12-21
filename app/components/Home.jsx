import React, { Component } from 'react'  // eslint-disable-line import/extensions
// import { Link } from 'react-router-dom';
import Mousetrap from 'mousetrap'
import Terminal from 'xterm'
import icons from 'file-icons-js'
import $ from 'jquery'
import { debug } from 'util'

const path = require('path')
const bytes = require('bytes')
const pty = require('node-pty')
const event2string = require('key-event-to-string')()
const fs = require('fs')

const sort = {
  fs_asc(a, b) {
    if (a < b) {
      return -1
    }
    if (a > b) {
      return 1
    }
    return 0
  }
}

const xterm = new Terminal()
// Notice it's called statically on the type, not an object
Terminal.loadAddon('fit')

function normalizePath(dir) {
  return path.resolve(dir.replace(/file:\/\/\//, '')).replace(/\\/g, '/')
}

function formatDate(date) {
  return (date || '').toLocaleString().replace(/,/g, ' ')
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

let showKeyInfoTimeout
let showKeyInfoRepeats = 0
let showKeyInfoHistory
function showKeyInfo(e, description) {
  let keys
  if (typeof e === 'string') {
    keys = e.split(' ')
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      if (key.length > 1) {
        keys[i] = capitalizeFirstLetter(key)
      }
    }
    keys = keys.join(' ')
  } else {
    keys = event2string(e)
  }
  if (showKeyInfoHistory === keys) {
    showKeyInfoRepeats++
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
    prefix = `${showKeyInfoRepeats + 1} x `
  }
  nfo.stop(true).fadeIn(0)
  nfo1.text(prefix + keys)
  nfo2.text(description || '')
  showKeyInfoTimeout = setTimeout(() => {
    nfo.fadeOut(1000)
  }, 1400)
}


const fitHeight = function fitHeight(el) {
  let total = $('.terminal-container-header').outerHeight() + 50
  if ($('.terminal-container:visible').length !== 0) {
    total += $('.terminal-container:visible').outerHeight() + 80
  }

  $(el).parent().children().not(el)
    .each(function () {
      total += $(this).outerHeight()
    })
  const newHeight = $(window).height() - total
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


  componentDidMount() {
    const self = this

    Mousetrap.bind('shift+s n up', (e) => {
      showKeyInfo('shift+s n up', 'Sort files ascending')
      return false
    })
    Mousetrap.bind('shift+s n down', (e) => {
      showKeyInfo('shift+s n down', 'Sort files descending')
      return false
    })

    Mousetrap.bind('down', (e) => {
      showKeyInfo(e)
      self.focusNextElement()
      return false
    })

    Mousetrap.bind('up', (e) => {
      showKeyInfo(e)
      self.focusPreviousElement()
      return false
    })

    Mousetrap.bind('space', (e) => {
      showKeyInfo(e)
      self.toggleSelection.bind(self)(e)
      return false
    })

    Mousetrap.bind('enter', (e) => {
      showKeyInfo(e, 'Enter current selected folder.')
      self.changeDirectory.bind(self)(e)
      return false
    })

    Mousetrap.bind(['tab', 'shift+tab'], (e) => {
      showKeyInfo(e, 'Toggle active filesystem view area.')
      self.toggleActiveArea.bind(self)(e)
      return false
    }, 'keydown')

    Mousetrap.bind('backspace', (e) => {
      showKeyInfo(e, 'Go to parent folder.')
      const areaIndex = self.state.activeAreaIndex
      const locationIndex = self.state.areas[areaIndex].activeLocationIndex
      const originalPath = self.state.areas[areaIndex].locations[locationIndex]
      const parentFolder = path.basename(originalPath)
      const p = normalizePath(path.join(originalPath, '..'))
      if (p !== originalPath) {
        self.setPath.bind(self)(areaIndex, p, parentFolder)
      }
      return false
    })

    Mousetrap.bind(['command+s', 'ctrl+s'], (e) => {
      showKeyInfo(e)
      self.showTerminal(true)
      return false
    })

    this.changeActiveTabIndex(1, this.state.areas[1], 0)
    this.changeActiveTabIndex(0, this.state.areas[0], 1)

    $(window).resize(() => { // On resize
      $('.file-system-view').each(function eachFileSystemView() {
        fitHeight(this)
      })
    })


    const terminalContainer = document.getElementById('terminal')
    const terminalInput = document.getElementById('terminal-input')

    $(terminalInput).keydown((e) => {
      if (e.keyCode === 13) {
        showKeyInfo(e)
        const txt = terminalInput.value
        term.write(`${txt}\r\n`)
        terminalInput.value = ''
      }
      if (e.keyCode === 27) {
        showKeyInfo(e)
        self.showTerminal(false)
      }
    })
    $(terminalInput).blur((e) => {
      self.showTerminal(false)
    })

    xterm.open(terminalContainer)


    const term = pty.spawn(process.platform === 'win32' ? 'cmd.exe' : 'bash', [], {
      name: 'xterm-color',
      cols: 180,
      rows: 80,
      cwd: process.env.PWD,
      env: process.env
    })
    term.on('data', (data) => {
      console.log(data)
      xterm.write(data)
    })

    term.on('key', (key, ev) => {
      const printable = (!ev.altKey && !ev.altGraphKey && !ev.ctrlKey && !ev.metaKey)

      if (ev.keyCode === 13) {
        term.prompt()
      } else if (ev.keyCode === 8) {
        // Do not delete the prompt
        if (term.x > 2) {
          term.write('\b \b')
        }
      } else if (printable) {
        term.write(key)
      }
    })

    term.write('cd c:\\temp\r\n')

    setTimeout(() => {
      $('.file-system-view').each(function () {
        fitHeight(this)
      })
    }, 100)
  }


  location(areaIndex) {
    return this.state.areas[areaIndex].locations[this.state.areas[areaIndex].activeLocationIndex]
  }


  setPath(areaIndex, newPath, parentFolder) {
    const state = this.state
    state.areas[areaIndex].locations[this.state.areas[areaIndex].activeLocationIndex] = newPath
    this.setState(state)
    this.changeActiveTabIndex(areaIndex, this.state.areas[areaIndex], this.state.areas[areaIndex].activeLocationIndex, parentFolder)
    return false
  }

  changeDirectory(e) {
    const el = document.activeElement
    const p = normalizePath(decodeURI(e.target.href))
    if ($(el).hasClass('folder')) {
      const areaIndex = $(el).data('area-index')
      this.state.areas[areaIndex].contents.directories = []
      this.state.areas[areaIndex].contents.files = []
      this.setPath(areaIndex, p)
      this.focusNextElement()
      e.preventDefault && e.preventDefault()
    }

    return false
  }

  toggleActiveArea(e) {
    const idx = parseInt(this.state.activeAreaIndex.toString() || '1', 10)
    const newIdx = (idx === 0 ? 1 : 0)
    this.setState({
      activeAreaIndex: newIdx
    })
    if (document.activeElement) {
      document.activeElement.blur()
    }
    this.focusNextElement(e)
    const p = this.state.areas[this.state.activeAreaIndex]
    const l = p.locations[p.activeLocationIndex]
    document.title = l
    e.preventDefault()
    return false
  }

  ignoreClick(e) {
    e.preventDefault && e.preventDefault()
    return true
  }

  toggleTerminal() {
    this.showTerminal(!$('.terminal-container').is(':visible'))
  }

  showTerminal(show) {
    const c = $('.terminal-container')
    const done = function () {
      $('.file-system-view').each(function () {
        fitHeight(this)
        if (c.is(':visible')) {
          $('#terminal-input').focus()
          xterm.fit()
        }
      })
    }

    if (show) {
      c.fadeIn(0, done)
    } else {
      c.fadeOut(0, done)
    }
  }

  focusNextElement() {
    // add all elements we want to include in our selection
    const x = $(document.activeElement)
    if (!x || !x.hasClass('filesystem-item')) {
      const selector = `.area-${(this.state.activeAreaIndex)}:first`

      $(selector).find('.filesystem-item:first').focus()
    } else {
      console.log('go')
      x.next().focus()
    }
    this.setState({ activeAreaIndex: $(document.activeElement).data('area-index') || this.state.activeAreaIndex })
  }

  focusPreviousElement(current) {
    // add all elements we want to include in our selection
    const x = $(document.activeElement)
    if (!x.hasClass('filesystem-item')) {
      $(`.area-${this.state.activeAreaIndex}:first`).find('.filesystem-item:last').focus()
    } else {
      x.prev().focus()
      this.setState({ activeAreaIndex: $(document.activeElement).data('area-index') })
    }
  }

  focusElement(selectItem) {
    if (selectItem) {
      const areaSelector = `.area-${this.state.activeAreaIndex}:first`
      const area = $(areaSelector)
      const fileSystemItemSelector = `.filesystem-item:contains('${selectItem}')`
      const item = area.find(fileSystemItemSelector)
      item.focus()
    }
  }

  changeActiveTabIndex(areaIndex, area, newActiveLocationIndex, selectItem) {
    const newState = this.state
    newState.activeAreaIndex = areaIndex
    newState.areas[areaIndex].activeLocationIndex = newActiveLocationIndex
    newState.areas[areaIndex].contents.directories = []
    this.setState(newState)
    const dir = decodeURI(newState.areas[areaIndex].locations[newActiveLocationIndex])

    const getDirs = function (rootDir, cb) {
      const files = fs.readdirSync(rootDir)
      const dirs = []
      const filenames = []
      let idx = files.length - 1
      files.forEach((file) => {
        if (file !== '.') {
          const filePath = `${rootDir}/${file}`

          try {
            var stats = fs.statSync(filePath)

            stats.name = file
            stats.fullpath = filePath
            if (stats.isDirectory()) {
              dirs.push(stats)
            } else {
              filenames.push(stats)
            }
          } catch (err) {
            var e = {
              name: file,
              fullpath: filePath
            }
            filenames.push(e)
          }

          dirs.sort(sort.fs_asc)
          files.sort(sort.fs_asc)

        }
      })
      return ({ directories: dirs, files: filenames, selectItem })
    }
    const contents = getDirs(dir)
    newState.areas[areaIndex].contents = contents
    this.setState(newState)
    this.focusElement(selectItem)
    document.title = dir
  }

  renderTabs(areaIndex, area) {
    const tabs = []
    for (let index = 0; index < area.locations.length; index++) {
      const location = area.locations[index].split('/').pop()
      tabs.push(
        <li className="tab" >
          <span onClick={() => this.changeActiveTabIndex(areaIndex, area, index)} className={index === area.activeLocationIndex ? 'tab-active' : null} >
            {location}/
          </span>
        </li>
      )
    }
    return (
      <ul className="tabs">{tabs}</ul>
    )
  }

  renderArea(areaIndex, area) {
    const files = []

    for (let d = 0; d < area.contents.directories.length; d++) {
      const dir = area.contents.directories[d]
      const icon = <i className="fa fa-folder" aria-hidden="true" />
      files.push(
        <a data-area-index={areaIndex} onClick={this.ignoreClick.bind(this)} onDoubleClick={this.changeDirectory.bind(this)} className={'filesystem-item folder'} href={dir.fullpath}>
          {icon} <span className={'filesystem-item-name'}>{dir.name}</span>
        </a>
      )
    }
    for (let f = 0; f < area.contents.files.length; f++) {
      const file = area.contents.files[f]
      const icn = (icons.getClassWithColor(file.name) || '')

      const iconClassName = icn.split(' ')[0]
      let iconClassColorName = icn.split(' ')[1]
      if (!iconClassColorName) {
        iconClassColorName = 'dark-cyan'
      }
      let icon = ''

      if (iconClassName) {
        icon = <span className={`file-type-icon ${iconClassName}`} aria-hidden="true" />
      } else {
        icon = <i className={'file-type-icon fa fa-file'} aria-hidden="true" />
      }
      files.push(
        <a data-area-index={areaIndex} onClick={this.ignoreClick.bind(this)} className={'filesystem-item ' + iconClassColorName} target="_blank" href={file.fullpath}>
          <div className="row no-gutter">
            <div className="col-xs-7">
              {icon} <span className={'filesystem-item-name '}> {file.name}</span>
            </div>
            <div className="col-xs-2 text-right">
              <span className={'filesystem-item-size'}>{bytes(file.size, { unitSeparator: ' ' })}</span>
            </div>
            <div className="col-xs-3">
              <span className={'filesystem-item-date'}>{formatDate(file.mtime)}</span>
            </div>
          </div>
        </a>
      )
    }

    const cn = `area area-${areaIndex}`
    const result = <ul className={cn}>{files}</ul>
    return result
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
            <i onClick={this.toggleTerminal.bind(this)} className="fa fa-terminal" aria-hidden="true" />
          </div>
        </div>
        <div className="row no-gutter vbottom terminal-container">
          <div className="col-sm-12 vbottom">
            <div id="terminal" />
            <input type="text" id="terminal-input" />
          </div>
        </div>
        <div id="key-press-info" className="center">
          <div id="key-press-info-short-cut" />
          <div id="key-press-info-description" />
        </div>
      </div>

    )
  }
}

export default Home
