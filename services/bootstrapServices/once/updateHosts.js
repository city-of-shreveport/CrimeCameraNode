const debug = require('debug')('updateHostsFile');
debug.enabled = true
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const fs = require('fs')
const dedent = require('dedent-js');

var config = {}

const writeFile = (file, text) => {
  fs.writeFile(file, text, function (error) {});
};

async function run() {
  debug("Beginning updateHosts procedures");

  debug("Reading config...");

  configString = fs.readFileSync('/mnt/ramdisk/config.json', 'utf8');

  config = JSON.parse(configString).config;

  debug('Loaded config. Setting up hosts...');

  writeFile(
    '/etc/hosts',
    dedent`
        # ipv4
        127.0.0.1 localhost
        127.0.1.1 ${config.hostName}

        # ipv6
        ::1     localhost ip6-localhost ip6-loopback
        ff02::1 ip6-allnodes
        ff02::2 ip6-allrouters
      `
  );

  debug("Hosts file written");
}

module.exports = {
  run
}
