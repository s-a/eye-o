#!/usr/bin/env node

const path = require("path");
const electroner = require("electroner");
process.env.NODE_ENV = 'production'
// Start the Electron app
electroner(path.join(__dirname, '../app/'), {

});
