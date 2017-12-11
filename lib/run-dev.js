#!/usr/bin/env node

const path = require('path');
const electroner = require('electroner');

process.env.NODE_ENV = 'development';
process.env.START_HOT = '1';

require("babel-register")('./node_modules/webpack-dev-server/bin/webpack-dev-server');
// node --trace-warnings -r babel-register ./node_modules/webpack-dev-server/bin/webpack-dev-server --config webpack.config.renderer.dev.js
// Start the Electron app
electroner(path.join(__dirname, '../app/'), {

});
