require('dotenv').config();

const util = require('util');
const exec = util.promisify(require('child_process').exec);

const debug = require('debug')('cleanStorageService')
debug.enabled = true
const fs = require('fs')

const dedent = require('dedent-js');

var config = {}

async function run() {
  while(true) {
    debug("Pulling config.")
    configString = fs.readFileSync('/mnt/ramdisk/config.json', 'utf8');

    config = JSON.parse(configString).config;
  }
}

run()
