const util = require('util');
const exec = util.promisify(require('child_process').exec);

const debug = require('debug')('setHostname')
debug.enabled = true
const fs = require('fs')

const dedent = require('dedent-js');

var config = {}

const execCommand = (command) => {
  return exec(command)
};

async function run() {
  debug("Reading config...");

  configString = fs.readFileSync('/mnt/ramdisk/config.json', 'utf8');

  config = JSON.parse(configString).config;

  debug('Loaded config. Setting up hosts...');

  debug(`Setting hostname: ${config.hostName} `);
  await execCommand(`sudo hostnamectl set-hostname ${config.hostName}`);
}

module.exports = {
  run
}
